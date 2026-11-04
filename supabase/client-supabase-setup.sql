-- Hell's Shawarma: full setup for the client's Supabase project.
-- Paste into Dashboard > SQL Editor and run once.
begin;

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

-- Explicit Data API grants. Newer Supabase projects may not expose new public
-- tables automatically; without these the site gets 404/permission errors even
-- though the RLS policies are correct. Run after 0002_blog_members.sql.
--
-- Grants only open the door: RLS still decides which rows each role can touch.

grant usage on schema public to anon, authenticated, service_role;

grant select on public.blog_categories, public.blog_posts, public.blog_post_redirects
  to anon, authenticated;

grant insert, update, delete on public.blog_categories, public.blog_posts to authenticated;

grant select on public.blog_members to authenticated;

grant all on public.blog_categories, public.blog_posts, public.blog_post_redirects,
  public.blog_members, public.blog_meta
  to service_role;

-- ---------------------------------------------------------------- data from old project
insert into public.blog_categories
select * from jsonb_populate_recordset(null::public.blog_categories, $blogdata$[{"id":"5d14ac59-40b1-4c34-aff5-bb61f3061187","slug":"food-culture","name":"Food & Culture","description":"The history, flavours and traditions behind Middle Eastern food, and how they found a home in Sri Lanka.","seo_title":"Middle Eastern Food & Culture | Hell's Shawarma Blog","seo_description":"Stories about shawarma, hummus, falafel and the Middle Eastern food culture behind every Hell's Shawarma wrap in Colombo.","sort_order":1,"created_at":"2026-10-29T08:10:02.972783+00:00","updated_at":"2026-10-29T08:10:02.972783+00:00"},{"id":"a1d9237f-43e0-45f9-875b-1fffa87ca6c8","slug":"behind-the-scenes","name":"Behind the Scenes","description":"A look inside the Hell's Shawarma kitchens: prep, people and the work that goes into every wrap.","seo_title":"Behind the Scenes at Hell's Shawarma","seo_description":"Go inside the Hell's Shawarma kitchen: how we marinate, grill and build every shawarma, from prep to the final slice.","sort_order":2,"created_at":"2026-10-29T08:10:02.972783+00:00","updated_at":"2026-10-29T08:10:02.972783+00:00"},{"id":"04b51f49-93ac-474e-9940-c2f3ef5060c1","slug":"our-locations","name":"Our Locations","description":"News and guides for every Hell's Shawarma branch across Colombo.","seo_title":"Hell's Shawarma Locations in Colombo","seo_description":"Find Hell's Shawarma in Dehiwala, Kollupitiya, Bamba Food Square and Pink Beach. Opening hours, what to order and what makes each branch unique.","sort_order":3,"created_at":"2026-10-29T08:10:02.972783+00:00","updated_at":"2026-10-29T08:10:02.972783+00:00"},{"id":"60f604cc-a4e9-4899-b7c3-a42f6f8bcc2a","slug":"tips-guides","name":"Tips & Guides","description":"Practical guides to ordering, pairing and enjoying shawarma.","seo_title":"Shawarma Tips & Guides | Hell's Shawarma","seo_description":"Ordering guides, pairing ideas and tips to get the most out of every shawarma, plate and snack pack at Hell's Shawarma.","sort_order":4,"created_at":"2026-10-29T08:10:02.972783+00:00","updated_at":"2026-10-29T08:10:02.972783+00:00"}]$blogdata$::jsonb)
on conflict (slug) do update set id = excluded.id, name = excluded.name, description = excluded.description, seo_title = excluded.seo_title, seo_description = excluded.seo_description, sort_order = excluded.sort_order, created_at = excluded.created_at, updated_at = excluded.updated_at;

insert into public.blog_posts
select * from jsonb_populate_recordset(null::public.blog_posts, $blogdata$[{"id":"d2a95c8e-9bb9-4fa1-8e76-345a6f6dee1c","slug":"what-makes-a-great-shawarma","title":"What Makes a Great Shawarma?","excerpt":"It's more than just meat in a wrap. Here's a closer look at the history, preparation and key elements that make a shawarma truly great.","content":"<p>Shawarma has a rich history that dates back to the Middle East, where thin slices of marinated meat are slow-cooked on a vertical spit. Over time, it has become one of the most loved street foods around the world, and here in Sri Lanka it holds a special place in the hearts (and late-night cravings) of many.</p>\n<p>At Hell's Shawarma, we stay true to the traditional method while adding our own touch with carefully selected spices, fresh ingredients and a focus on authentic flavour. So what actually makes a great shawarma? These are the five things we obsess over.</p>\n<h2>1. The Marinade</h2>\n<p>It all starts with the marinade. A blend of Middle Eastern spices, garlic, acidity and a few of our own secrets gives the meat its bold, distinct flavour. Time matters as much as the recipe: the meat needs long enough in the marinade for the flavour to go all the way through, not just sit on the surface.</p>\n<p>A great shawarma tastes seasoned in every bite. If the outside is tasty but the middle is bland, the marinade was rushed.</p>\n<h2>2. The Vertical Spit</h2>\n<p>The spit is what makes shawarma <em>shawarma</em>. Layers of marinated meat are stacked and roasted slowly as they turn, so the outside caramelises while the inside stays juicy. Thin slices are shaved off the outer layer as it crisps, which is why every portion gets those charred, flavour-packed edges.</p>\n<div class=\"callout\"><p>Tip: The best time to order is when you can see the cook shaving fresh slices straight off the spit. That crisp-edged meat is what you're after.</p></div>\n<h2>3. Fresh, Soft Bread</h2>\n<p>The wrap holds everything together, literally. Good shawarma bread is soft enough to fold without cracking, but sturdy enough to survive sauce and juices. A quick toast on the grill adds texture and keeps it from going soggy before the last bite.</p>\n<h2>4. Sauces That Balance the Richness</h2>\n<p>Garlic sauce (toum), tahini and a touch of chilli each play a role. Garlic brings punch, tahini adds a nutty creaminess, and heat cuts through the richness of the meat. The goal is balance: enough sauce in every bite, never so much that it drowns the meat.</p>\n<h2>5. The Build</h2>\n<p>Pickles for crunch and acidity, fresh vegetables for freshness, and meat spread evenly from end to end. A great shawarma is built so the first bite and the last bite taste equally good. It's a small detail that separates a good wrap from one you keep thinking about.</p>\n<h2>Different Styles, Same Fundamentals</h2>\n<p>Across the Middle East, shawarma changes from country to country: different spice blends, breads and sauces. That's why our menu includes Middle Eastern, Yemeni, Turkish and Palestinian styles of both <a href=\"/menu\">chicken and beef shawarma</a>. The flavours differ, but the fundamentals above stay the same.</p>\n<h2>Taste the Difference</h2>\n<p>The best way to judge a shawarma is to eat one. Visit any of our <a href=\"/blog/our-locations-across-colombo\">Hell's Shawarma branches across Colombo</a> and taste what all that care adds up to.</p>\n<p class=\"cta-row\"><a class=\"cta-button\" href=\"/menu\">View the menu</a></p>","toc":[],"faqs":[{"answer":"Shawarma is thinly sliced marinated meat, usually chicken or beef, slow-roasted on a vertical spit and served in flatbread or on a plate with sauces, pickles and salad.","question":"What is shawarma made of?"},{"answer":"It can be a balanced meal: grilled protein, fresh vegetables and bread. Sauces, cheese and fries add calories, so a shawarma plate with salad and hummus is the lighter way to enjoy it.","question":"Is shawarma healthy?"}],"word_count":0,"reading_minutes":1,"cover_image_url":null,"cover_image_alt":null,"cover_image_width":null,"cover_image_height":null,"category_id":"5d14ac59-40b1-4c34-aff5-bb61f3061187","tags":["shawarma","middle eastern food","colombo"],"author_name":"Hell's Shawarma","status":"draft","published_at":null,"seo_title":"What Makes a Great Shawarma? The 5 Things That Matter","seo_description":"What separates a great shawarma from an average wrap? The marinade, the spit, the bread, the sauce and the build. Here's what to look for, from our Colombo kitchen.","focus_keyword":"great shawarma","og_image_url":null,"canonical_url":null,"noindex":false,"created_at":"2026-10-29T08:11:42.119047+00:00","updated_at":"2026-10-29T08:40:08.590588+00:00","created_by":null},{"id":"58aa6500-b161-4118-9f1f-66c608d39e28","slug":"inside-our-kitchen","title":"Inside Our Kitchen: Fresh, Daily, Always","excerpt":"A look at how we prepare our meat fresh every day, from marination to the final slice.","content":"<p>Every shawarma that leaves our counter starts hours earlier, long before the first customer walks in. Here's a look behind the scenes at how a day in a Hell's Shawarma kitchen comes together.</p>\n<h2>Prep Starts Early</h2>\n<p>Before service, the team is already at work: trimming and slicing meat, mixing marinades, chopping vegetables and preparing sauces. Doing this fresh, every day, is the single biggest reason our food tastes the way it does.</p>\n<h2>Marination: Where the Flavour Is Built</h2>\n<p>Chicken and beef each get their own marinade, built around Middle Eastern spices and garlic. The meat rests in it long enough for the flavour to soak right through. It's the slowest step in the process, and the one we never rush.</p>\n<h2>Stacking the Spit</h2>\n<p>Marinated meat is layered onto the vertical spit by hand. How it's stacked affects how evenly it cooks, so it's a job done with care. Once it starts turning in front of the heat, the outside slowly caramelises while the inside stays tender.</p>\n<h2>Sauces and Sides, Made In-House</h2>\n<p>Our signature sauces, including our garlic toum, are house-made. Alongside them sits our <a href=\"/blog/hummus-a-timeless-middle-eastern-classic\">hummus</a>, a favourite whether as a dip or the base of a hummus plate.</p>\n<h2>Built to Order</h2>\n<p>When you order, your shawarma is built right then: fresh slices off the spit, bread warmed on the grill, sauces, pickles and vegetables added, then wrapped and toasted.</p>\n<div class=\"callout\"><p>All of our meat is 100% halal.</p></div>\n<h2>Why It Matters</h2>\n<p>Fresh prep every day takes more time and effort than shortcuts. But it's the difference between a wrap and a <a href=\"/blog/what-makes-a-great-shawarma\">great shawarma</a>, and it's why people keep coming back.</p>\n<p class=\"cta-row\"><a class=\"cta-button\" href=\"/#contact\">Find a branch near you</a></p>","toc":[],"faqs":[],"word_count":0,"reading_minutes":1,"cover_image_url":null,"cover_image_alt":null,"cover_image_width":null,"cover_image_height":null,"category_id":"a1d9237f-43e0-45f9-875b-1fffa87ca6c8","tags":["behind the scenes","kitchen","fresh food"],"author_name":"Hell's Shawarma","status":"draft","published_at":null,"seo_title":"Inside Our Shawarma Kitchen: Fresh, Daily, Always","seo_description":"Go behind the counter at Hell's Shawarma: how we prep, marinate, grill and build every shawarma fresh each day in our Colombo kitchens.","focus_keyword":"shawarma kitchen","og_image_url":null,"canonical_url":null,"noindex":false,"created_at":"2026-10-29T08:11:42.119047+00:00","updated_at":"2026-10-29T08:40:08.590588+00:00","created_by":null},{"id":"b116655b-8132-4e89-8b2b-4657805e30b9","slug":"hummus-a-timeless-middle-eastern-classic","title":"Hummus: A Timeless Middle Eastern Classic","excerpt":"Discover what makes hummus such an iconic part of Middle Eastern food, and of our menu.","content":"<p>Few dishes are as simple, or as loved, as hummus. Smooth, creamy and full of flavour, it has been a staple across the Middle East for generations and is now enjoyed all over the world.</p>\n<h2>What Is Hummus?</h2>\n<p>At its heart, hummus is a blend of just a handful of ingredients:</p>\n<ul>\n<li><strong>Chickpeas</strong>, cooked until soft</li>\n<li><strong>Tahini</strong>, a paste made from sesame seeds</li>\n<li><strong>Lemon juice</strong> for brightness</li>\n<li><strong>Garlic</strong> for depth</li>\n<li><strong>Olive oil</strong> to finish</li>\n</ul>\n<p>The magic is in the balance. Too much tahini and it turns heavy; too little lemon and it falls flat. Great hummus is silky, nutty, a little tangy and rich without being greasy.</p>\n<h2>A Dish With Deep Roots</h2>\n<p>Hummus is eaten across Lebanon, Syria, Palestine, Jordan and beyond, and each place has its own way of making and serving it. It's a sharing dish, usually scooped up with warm bread and served alongside grilled meats, falafel and salads.</p>\n<h2>How We Serve It</h2>\n<p>At Hell's Shawarma, hummus is more than a side. Our <a href=\"/menu\">hummus plates</a> come topped with shawarma chicken, shawarma beef, or fiery falafels for a vegetarian option, served with pita. You can also add a hummus dip to any order.</p>\n<div class=\"callout\"><p>Vegetarian? The hummus plate with falafels and our falafel wrap are both meat-free.</p></div>\n<h2>Why Hummus and Shawarma Work So Well Together</h2>\n<p>Shawarma is rich, smoky and savoury. Hummus is cool, creamy and bright. Together, each makes the other taste better, which is why a hummus plate is one of the most satisfying ways to <a href=\"/blog/what-makes-a-great-shawarma\">enjoy shawarma</a>.</p>\n<p class=\"cta-row\"><a class=\"cta-button\" href=\"/menu\">See our hummus plates</a></p>","toc":[],"faqs":[{"answer":"Yes. Classic hummus is made from chickpeas, tahini, lemon juice, garlic and olive oil, so it is vegetarian and usually vegan too.","question":"Is hummus vegetarian?"},{"answer":"Warm pita bread is traditional. It is also great with falafel, grilled meat such as shawarma, or fresh vegetables.","question":"What do you eat hummus with?"}],"word_count":0,"reading_minutes":1,"cover_image_url":null,"cover_image_alt":null,"cover_image_width":null,"cover_image_height":null,"category_id":"5d14ac59-40b1-4c34-aff5-bb61f3061187","tags":["hummus","middle eastern food","vegetarian"],"author_name":"Hell's Shawarma","status":"draft","published_at":null,"seo_title":"Hummus: The Middle Eastern Classic Explained | Hell's Shawarma","seo_description":"What is hummus, where does it come from and how is it best eaten? A short guide to the Middle Eastern classic, plus how to enjoy it at Hell's Shawarma in Colombo.","focus_keyword":"hummus","og_image_url":null,"canonical_url":null,"noindex":false,"created_at":"2026-10-29T08:11:42.119047+00:00","updated_at":"2026-10-29T08:40:08.590588+00:00","created_by":null},{"id":"5a3d2e00-8145-42f8-b41f-a0d292ac0854","slug":"our-locations-across-colombo","title":"Our Locations Across Colombo","excerpt":"From Dehiwala to Kollupitiya and beyond, find out what makes each Hell's Shawarma branch unique.","content":"<p>Craving shawarma in Colombo? Hell's Shawarma now has four branches across the city, each serving the same flame-grilled shawarmas, hummus plates and snack packs, with a vibe of its own. Here's where to find us and when we're open.</p>\n<h2>Dehiwala: Fusion Food Court</h2>\n<p>Our Dehiwala branch at <strong>Fusion Food Court</strong> is a go-to for south Colombo. A relaxed food-court setting makes it easy to come with friends and share a few snack packs.</p>\n<p><strong>Hours:</strong> Daily, 2:30 PM – 1 AM</p>\n<h2>Kollupitiya: Hey Marine, Marine Drive</h2>\n<p>Find us at <strong>Hey Marine on Marine Drive, Colombo 3</strong>. A seaside spot that's perfect for an evening bite.</p>\n<p><strong>Hours:</strong> Friday – Sunday, 5 PM – 1 AM · Tuesday – Thursday, 5 PM – 12:30 AM · Closed Mondays</p>\n<h2>Bamba Food Square, Colombo 4</h2>\n<p>Our branch at <strong>Bamba Food Square</strong> puts Hell's Shawarma in the middle of one of Colombo 4's busiest food spots.</p>\n<p><strong>Hours:</strong> Daily, 2:30 PM – 1 AM</p>\n<h2>Pink Beach, Marine Drive, Colombo 4</h2>\n<p>At <strong>Pink Beach on Marine Drive</strong>, you can enjoy your shawarma with the sea breeze.</p>\n<p><strong>Hours:</strong> Daily, 2:30 PM – 1 AM</p>\n<h2>Late-Night Shawarma in Colombo</h2>\n<p>Most of our branches stay open until 1 AM, making Hell's Shawarma one of the easiest places in Colombo to grab proper food late at night.</p>\n<div class=\"callout\"><p>Can't make it in? Order Hell's Shawarma for delivery on Uber Eats, or call us on 072 320 5285.</p></div>\n<h2>Same Menu, Every Branch</h2>\n<p>Whichever branch you visit, you'll find the full <a href=\"/menu\">Hell's Shawarma menu</a>: chicken and beef shawarma in multiple regional styles, shawarma and hummus plates, falafel and loaded snack packs. Not sure what to order? Read our guide to <a href=\"/blog/chicken-vs-beef-shawarma\">chicken vs beef shawarma</a>.</p>\n<p class=\"cta-row\"><a class=\"cta-button\" href=\"/#contact\">Get directions</a></p>","toc":[],"faqs":[{"answer":"We have four branches: Fusion Food Court in Dehiwala, Hey Marine on Marine Drive in Colombo 3 (Kollupitiya), Bamba Food Square in Colombo 4, and Pink Beach on Marine Drive in Colombo 4.","question":"Where can I find Hell's Shawarma in Colombo?"},{"answer":"Most branches are open daily from 2:30 PM to 1 AM. The Kollupitiya branch opens at 5 PM, closes at 12:30 AM Tuesday to Thursday and 1 AM Friday to Sunday, and is closed on Mondays.","question":"What time does Hell's Shawarma close?"},{"answer":"Yes, you can order Hell's Shawarma for delivery through Uber Eats.","question":"Does Hell's Shawarma deliver?"}],"word_count":0,"reading_minutes":1,"cover_image_url":null,"cover_image_alt":null,"cover_image_width":null,"cover_image_height":null,"category_id":"04b51f49-93ac-474e-9940-c2f3ef5060c1","tags":["colombo","dehiwala","kollupitiya","locations"],"author_name":"Hell's Shawarma","status":"draft","published_at":null,"seo_title":"Shawarma in Colombo: All Hell's Shawarma Locations & Hours","seo_description":"Looking for shawarma in Colombo? Find every Hell's Shawarma branch: Dehiwala, Kollupitiya (Marine Drive), Bamba Food Square and Pink Beach, with opening hours.","focus_keyword":"shawarma in Colombo","og_image_url":null,"canonical_url":null,"noindex":false,"created_at":"2026-10-29T08:11:42.119047+00:00","updated_at":"2026-10-29T08:40:08.590588+00:00","created_by":null},{"id":"bcb2c0b6-967d-4a4f-a31b-a400c82d7a8a","slug":"the-spices-that-bring-it-all-together","title":"The Spices That Bring It All Together","excerpt":"A closer look at the spices and flavours that define our shawarmas.","content":"<p>Ask anyone what makes shawarma taste like shawarma and the answer usually comes back to one thing: the spices. Warm, smoky and aromatic, the right blend turns simple grilled meat into something unforgettable.</p>\n<h2>The Classic Shawarma Spices</h2>\n<p>Every kitchen has its own blend, but these spices show up again and again across Middle Eastern shawarma recipes:</p>\n<ul>\n<li><strong>Cumin</strong>: earthy and warm, the backbone of most blends.</li>\n<li><strong>Coriander</strong>: citrusy and bright, it lifts the heavier spices.</li>\n<li><strong>Paprika</strong>: colour and gentle smokiness.</li>\n<li><strong>Turmeric</strong>: golden colour and a subtle bitterness.</li>\n<li><strong>Cardamom and cinnamon</strong>: a hint of warmth and sweetness.</li>\n<li><strong>Black pepper and chilli</strong>: heat that builds slowly.</li>\n<li><strong>Garlic</strong>: not a dried spice, but impossible to leave out.</li>\n</ul>\n<h2>Chicken vs Beef: Different Blends</h2>\n<p>Chicken and beef don't take spices the same way. Chicken suits brighter, more aromatic blends with plenty of garlic and citrus. Beef stands up to deeper, earthier and warmer spices. That's why the two shawarmas on our menu taste distinct, not just like the same recipe with a different meat. (More on that in our <a href=\"/blog/chicken-vs-beef-shawarma\">chicken vs beef guide</a>.)</p>\n<h2>Regional Twists</h2>\n<p>Travel across the Middle East and the blend changes. Some styles lean smoky, others herby, others hot. Our menu features Middle Eastern, Yemeni, Turkish and Palestinian-style shawarmas so you can taste the difference for yourself.</p>\n<h2>Where Sri Lanka Comes In</h2>\n<p>Sri Lanka knows its spices. Cinnamon, cardamom and pepper are part of everyday cooking here, which might be why shawarma has found such a loyal following on the island. For heat lovers, our chilli shawarmas bring an extra kick.</p>\n<div class=\"callout\"><p>Like it hot? Look for the flame icons on our menu. The more flames, the spicier it gets.</p></div>\n<p class=\"cta-row\"><a class=\"cta-button\" href=\"/menu\">Explore the menu</a></p>","toc":[],"faqs":[],"word_count":0,"reading_minutes":1,"cover_image_url":null,"cover_image_alt":null,"cover_image_width":null,"cover_image_height":null,"category_id":"5d14ac59-40b1-4c34-aff5-bb61f3061187","tags":["spices","shawarma spices","middle eastern food"],"author_name":"Hell's Shawarma","status":"draft","published_at":null,"seo_title":"Shawarma Spices: The Flavours Behind Every Wrap","seo_description":"Cumin, coriander, paprika, cardamom and more: a guide to the classic shawarma spices and what each one adds to the flavour.","focus_keyword":"shawarma spices","og_image_url":null,"canonical_url":null,"noindex":false,"created_at":"2026-10-29T08:11:42.119047+00:00","updated_at":"2026-10-29T08:40:08.590588+00:00","created_by":null},{"id":"f7d0638b-7691-479f-bd6c-fe93a93bd3ed","slug":"chicken-vs-beef-shawarma","title":"Chicken vs Beef Shawarma: Which One Is for You?","excerpt":"A quick guide to help you choose your perfect wrap.","content":"<p>It's the question we hear most at the counter: chicken or beef? Both are flame-grilled on the spit and both are packed with flavour, but they're different experiences. Here's a quick guide to help you choose.</p>\n<h2>Chicken Shawarma: Light, Juicy and Aromatic</h2>\n<p>Chicken shawarma is the classic for a reason. The meat stays juicy, takes on the marinade beautifully and pairs perfectly with garlic sauce. It's lighter and brighter in flavour, which makes it a great first choice if you're new to shawarma.</p>\n<p><strong>Choose chicken if:</strong> you like garlicky, aromatic flavours and a lighter wrap.</p>\n<h2>Beef Shawarma: Rich, Bold and Meaty</h2>\n<p>Beef shawarma is deeper and richer. Warm, earthy spices and those crisp edges from the spit give it a bolder, more savoury bite. It pairs well with tahini and a bit of heat.</p>\n<p><strong>Choose beef if:</strong> you want something hearty with a stronger, meatier flavour.</p>\n<h2>Side-by-Side</h2>\n<table>\n<thead><tr><th></th><th>Chicken</th><th>Beef</th></tr></thead>\n<tbody>\n<tr><td>Flavour</td><td>Bright, garlicky, aromatic</td><td>Rich, earthy, savoury</td></tr>\n<tr><td>Texture</td><td>Juicy and tender</td><td>Hearty with crisp edges</td></tr>\n<tr><td>Best sauce</td><td>Garlic sauce</td><td>Tahini and chilli</td></tr>\n<tr><td>Great for</td><td>First-timers, lighter meals</td><td>Big appetites, meat lovers</td></tr>\n</tbody>\n</table>\n<h2>Can't Decide? Get Both</h2>\n<p>Our <strong>Hell's Combo Snack Pack</strong> comes loaded with both chicken and beef, so you don't have to choose. Shawarma plates are another great way to try more of each.</p>\n<h2>Try a Regional Style</h2>\n<p>Whichever meat you pick, try one of our regional styles: Middle Eastern, Yemeni, Turkish or Palestinian, or the chilli and cheesy versions. Read about <a href=\"/blog/the-spices-that-bring-it-all-together\">the spices behind each one</a>.</p>\n<div class=\"callout\"><p>All our meat is 100% halal.</p></div>\n<p class=\"cta-row\"><a class=\"cta-button\" href=\"/menu\">Choose your shawarma</a></p>","toc":[],"faqs":[{"answer":"Chicken shawarma is the most widely ordered style around the world thanks to its lighter flavour, but beef has a loyal following among people who prefer a richer, meatier wrap.","question":"Which is more popular, chicken or beef shawarma?"},{"answer":"Yes. Hell's Shawarma serves 100% halal meat.","question":"Is the beef shawarma at Hell's Shawarma halal?"}],"word_count":0,"reading_minutes":1,"cover_image_url":null,"cover_image_alt":null,"cover_image_width":null,"cover_image_height":null,"category_id":"60f604cc-a4e9-4899-b7c3-a42f6f8bcc2a","tags":["chicken shawarma","beef shawarma","guide"],"author_name":"Hell's Shawarma","status":"draft","published_at":null,"seo_title":"Chicken vs Beef Shawarma: Which Should You Order?","seo_description":"Chicken or beef shawarma? Compare flavour, texture and spice so you can pick your perfect wrap, plus our favourite ways to order each at Hell's Shawarma.","focus_keyword":"chicken vs beef shawarma","og_image_url":null,"canonical_url":null,"noindex":false,"created_at":"2026-10-29T08:11:42.119047+00:00","updated_at":"2026-10-29T09:24:21.11038+00:00","created_by":null}]$blogdata$::jsonb)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- first admin
-- Uses the single existing Auth user; stops and rolls everything back otherwise.
do $$
declare
  n int;
  admin_id uuid;
  admin_email text;
begin
  select count(*) into n from auth.users;
  if n <> 1 then
    raise exception 'Expected exactly 1 user in Authentication > Users, found %. Nothing was changed.', n;
  end if;
  select id, email into admin_id, admin_email from auth.users;

  insert into public.blog_members (user_id, email, display_name, permissions, password_changed_at)
  values (admin_id, admin_email, '',
    array['posts.create', 'posts.edit_all', 'posts.publish', 'posts.delete',
          'categories.manage', 'site.rebuild', 'users.manage'],
    now())
  on conflict (user_id) do update set permissions = excluded.permissions,
    disabled = false, must_change_password = false;

  update public.blog_posts set created_by = admin_id where created_by is null;
  raise notice 'Admin set to %', admin_email;
end;
$$;

commit;
