-- Team members with granular permissions (replaces blog_admins).
-- Run once in Supabase Dashboard > SQL Editor, after 0001_blog.sql.
--
-- Permissions:
--   posts.create       write drafts (and edit their own drafts)
--   posts.edit_all     edit anyone's posts
--   posts.publish      publish / schedule / unpublish (and edit live posts)
--   posts.delete       delete posts
--   categories.manage  create / edit / delete categories
--   site.rebuild       trigger a site rebuild manually
--   users.manage       invite / edit / disable / remove team members
--
-- blog_members is only written by Netlify Functions using the secret key;
-- the browser can read it (for names/permissions) but never modify it.

create table if not exists public.blog_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  permissions text[] not null default '{}'
    check (permissions <@ array['posts.create', 'posts.edit_all', 'posts.publish', 'posts.delete',
                                'categories.manage', 'site.rebuild', 'users.manage']::text[]),
  disabled boolean not null default false,
  must_change_password boolean not null default false,
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz,
  password_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists blog_members_touch on public.blog_members;
create trigger blog_members_touch before update on public.blog_members
  for each row execute function public.blog_touch_updated_at();

-- Bring existing admins across with every permission.
insert into public.blog_members (user_id, email, permissions)
select a.user_id, u.email,
       array['posts.create', 'posts.edit_all', 'posts.publish', 'posts.delete',
             'categories.manage', 'site.rebuild', 'users.manage']
from public.blog_admins a
join auth.users u on u.id = a.user_id
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------- helpers
create or replace function public.blog_is_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.blog_members
    where user_id = auth.uid() and not disabled and not must_change_password
  );
$$;

create or replace function public.blog_can(perm text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.blog_members
    where user_id = auth.uid() and not disabled and not must_change_password
      and perm = any (permissions)
  );
$$;

grant execute on function public.blog_is_member() to anon, authenticated;
grant execute on function public.blog_can(text) to anon, authenticated;

-- Kept for backwards compatibility with anything still calling it.
create or replace function public.is_blog_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.blog_is_member(); $$;

alter table public.blog_members enable row level security;

drop policy if exists "members read own row" on public.blog_members;
create policy "members read own row" on public.blog_members
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "active members read team" on public.blog_members;
create policy "active members read team" on public.blog_members
  for select to authenticated using (public.blog_is_member());

-- ---------------------------------------------------------------- post ownership
alter table public.blog_posts
  add column if not exists created_by uuid references auth.users (id) on delete set null default auth.uid();

update public.blog_posts
set created_by = (select user_id from public.blog_members order by created_at limit 1)
where created_by is null;

-- ---------------------------------------------------------------- post policies
drop policy if exists "admins read all posts" on public.blog_posts;
drop policy if exists "admins insert posts" on public.blog_posts;
drop policy if exists "admins update posts" on public.blog_posts;
drop policy if exists "admins delete posts" on public.blog_posts;

drop policy if exists "members read all posts" on public.blog_posts;
create policy "members read all posts" on public.blog_posts
  for select to authenticated using (public.blog_is_member());

-- New posts belong to their creator; only publishers may create them already live.
drop policy if exists "members create posts" on public.blog_posts;
create policy "members create posts" on public.blog_posts
  for insert to authenticated
  with check (
    public.blog_can('posts.create')
    and created_by = auth.uid()
    and (status = 'draft' or public.blog_can('posts.publish'))
  );

-- Editable when it's yours (or you can edit all); live posts and status changes need publish rights.
drop policy if exists "members update posts" on public.blog_posts;
create policy "members update posts" on public.blog_posts
  for update to authenticated
  using (
    (public.blog_can('posts.edit_all') or (created_by = auth.uid() and public.blog_can('posts.create')))
    and (status = 'draft' or public.blog_can('posts.publish'))
  )
  with check (
    (public.blog_can('posts.edit_all') or (created_by = auth.uid() and public.blog_can('posts.create')))
    and (status = 'draft' or public.blog_can('posts.publish'))
  );

drop policy if exists "members delete posts" on public.blog_posts;
create policy "members delete posts" on public.blog_posts
  for delete to authenticated using (public.blog_can('posts.delete'));

-- Ownership can't be reassigned from the browser.
create or replace function public.blog_lock_created_by()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    new.created_by = old.created_by;
  end if;
  return new;
end;
$$;

drop trigger if exists blog_posts_lock_owner on public.blog_posts;
create trigger blog_posts_lock_owner before update on public.blog_posts
  for each row execute function public.blog_lock_created_by();

-- ---------------------------------------------------------------- category policies
drop policy if exists "admins manage categories" on public.blog_categories;
drop policy if exists "members manage categories" on public.blog_categories;
create policy "members manage categories" on public.blog_categories
  for all to authenticated
  using (public.blog_can('categories.manage'))
  with check (public.blog_can('categories.manage'));

-- ---------------------------------------------------------------- redirect policies
-- Rows are written by the security-definer slug trigger; nobody edits them directly.
drop policy if exists "admins manage redirects" on public.blog_post_redirects;

-- ---------------------------------------------------------------- retire blog_admins
drop policy if exists "admins read own row" on public.blog_admins;
drop table if exists public.blog_admins;
