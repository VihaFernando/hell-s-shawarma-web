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
