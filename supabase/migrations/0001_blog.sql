-- Hell's Shawarma blog schema.
-- Run once in Supabase Dashboard > SQL Editor (or `supabase db push`).
--
-- Visibility model:
--   * A post is public when status = 'published' AND published_at <= now().
--     A published post with a future published_at is "scheduled"; it becomes
--     visible automatically and the hourly Netlify function rebuilds the site.
--   * Only users listed in blog_admins can write anything.
--   * blog_meta is server-only (no policies => only the secret key can access it).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- admins
create table if not exists public.blog_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.blog_admins enable row level security;

create or replace function public.is_blog_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.blog_admins where user_id = auth.uid());
$$;

grant execute on function public.is_blog_admin() to anon, authenticated;

drop policy if exists "admins read own row" on public.blog_admins;
create policy "admins read own row" on public.blog_admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- shared
create or replace function public.blog_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- categories
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists blog_categories_touch on public.blog_categories;
create trigger blog_categories_touch before update on public.blog_categories
  for each row execute function public.blog_touch_updated_at();

alter table public.blog_categories enable row level security;

drop policy if exists "categories are public" on public.blog_categories;
create policy "categories are public" on public.blog_categories
  for select to anon, authenticated using (true);

drop policy if exists "admins manage categories" on public.blog_categories;
create policy "admins manage categories" on public.blog_categories
  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

-- ---------------------------------------------------------------- posts
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('page', 'category', 'rss', 'feed', 'tag')),
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  toc jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  word_count int not null default 0,
  reading_minutes int not null default 1,

  cover_image_url text,
  cover_image_alt text,
  cover_image_width int,
  cover_image_height int,

  category_id uuid references public.blog_categories (id) on delete set null,
  tags text[] not null default '{}',
  author_name text not null default 'Hell''s Shawarma',

  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,

  seo_title text,
  seo_description text,
  focus_keyword text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint blog_posts_published_has_date check (status <> 'published' or published_at is not null)
);

create index if not exists blog_posts_public_idx on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx on public.blog_posts (category_id);

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch before update on public.blog_posts
  for each row execute function public.blog_touch_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "published posts are public" on public.blog_posts;
create policy "published posts are public" on public.blog_posts
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

drop policy if exists "admins read all posts" on public.blog_posts;
create policy "admins read all posts" on public.blog_posts
  for select to authenticated using (public.is_blog_admin());

drop policy if exists "admins insert posts" on public.blog_posts;
create policy "admins insert posts" on public.blog_posts
  for insert to authenticated with check (public.is_blog_admin());

drop policy if exists "admins update posts" on public.blog_posts;
create policy "admins update posts" on public.blog_posts
  for update to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

drop policy if exists "admins delete posts" on public.blog_posts;
create policy "admins delete posts" on public.blog_posts
  for delete to authenticated using (public.is_blog_admin());

-- ---------------------------------------------------------------- slug history
-- Old slugs become 301 redirects at build time, so renamed posts keep their
-- rankings and inbound links.
create table if not exists public.blog_post_redirects (
  old_slug text primary key,
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.blog_post_redirects enable row level security;

drop policy if exists "redirects are public" on public.blog_post_redirects;
create policy "redirects are public" on public.blog_post_redirects
  for select to anon, authenticated using (true);

drop policy if exists "admins manage redirects" on public.blog_post_redirects;
create policy "admins manage redirects" on public.blog_post_redirects
  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

create or replace function public.blog_record_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is distinct from old.slug then
    -- Only slugs that were ever public are worth redirecting.
    if old.status = 'published' then
      insert into public.blog_post_redirects (old_slug, post_id)
      values (old.slug, new.id)
      on conflict (old_slug) do update set post_id = excluded.post_id;
    end if;
    -- A post reclaiming one of its old slugs must not redirect to itself.
    delete from public.blog_post_redirects where old_slug = new.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists blog_posts_slug_history on public.blog_posts;
create trigger blog_posts_slug_history after update of slug on public.blog_posts
  for each row execute function public.blog_record_slug_change();

-- ---------------------------------------------------------------- server meta
-- Key/value store used by Netlify Functions (last rebuild trigger, last
-- IndexNow ping). No policies: reachable only with the secret key.
create table if not exists public.blog_meta (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.blog_meta enable row level security;

-- ---------------------------------------------------------------- seed categories
insert into public.blog_categories (slug, name, description, seo_title, seo_description, sort_order) values
  ('food-culture', 'Food & Culture',
   'The history, flavours and traditions behind Middle Eastern food, and how they found a home in Sri Lanka.',
   'Middle Eastern Food & Culture | Hell''s Shawarma Blog',
   'Stories about shawarma, hummus, falafel and the Middle Eastern food culture behind every Hell''s Shawarma wrap in Colombo.',
   1),
  ('behind-the-scenes', 'Behind the Scenes',
   'A look inside the Hell''s Shawarma kitchens: prep, people and the work that goes into every wrap.',
   'Behind the Scenes at Hell''s Shawarma',
   'Go inside the Hell''s Shawarma kitchen: how we marinate, grill and build every shawarma, from prep to the final slice.',
   2),
  ('our-locations', 'Our Locations',
   'News and guides for every Hell''s Shawarma branch across Colombo.',
   'Hell''s Shawarma Locations in Colombo',
   'Find Hell''s Shawarma in Dehiwala, Kollupitiya, Bamba Food Square and Pink Beach. Opening hours, what to order and what makes each branch unique.',
   3),
  ('tips-guides', 'Tips & Guides',
   'Practical guides to ordering, pairing and enjoying shawarma.',
   'Shawarma Tips & Guides | Hell''s Shawarma',
   'Ordering guides, pairing ideas and tips to get the most out of every shawarma, plate and snack pack at Hell''s Shawarma.',
   4)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- make yourself admin
-- 1. Create your user in Authentication > Users > Add user (tick "Auto Confirm User").
-- 2. Replace the email below and run this statement:
--
-- insert into public.blog_admins (user_id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict do nothing;
