// Build-time blog data, shared by vite.config.ts (which pages to prerender) and
// scripts/blog-postbuild.mjs (sitemap, RSS, redirects). Plain JS so Node can run
// the post-build script without a TypeScript loader.

// Keep in sync with BLOG_PAGE_SIZE in src/lib/blog/types.ts.
export const BLOG_PAGE_SIZE = 9;

export function supabaseEnv(env = process.env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

async function rest(cfg, path) {
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    headers: { apikey: cfg.key, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`[blog] Supabase ${res.status} for ${path}: ${await res.text()}`);
  return res.json();
}

/**
 * Everything that is publicly visible right now. Uses the publishable key, so
 * Row Level Security guarantees drafts and scheduled posts are never included.
 */
export async function fetchPublishedBlog(env = process.env) {
  const cfg = supabaseEnv(env);
  if (!cfg) {
    console.warn(
      "[blog] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set; skipping blog pages.",
    );
    return null;
  }
  const now = new Date().toISOString();
  const [posts, categories, redirects] = await Promise.all([
    rest(
      cfg,
      `blog_posts?select=slug,title,excerpt,cover_image_url,cover_image_alt,published_at,updated_at,noindex,canonical_url,category:blog_categories(slug,name)` +
        `&status=eq.published&published_at=lte.${now}&order=published_at.desc`,
    ),
    rest(cfg, "blog_categories?select=slug,name,updated_at&order=sort_order.asc"),
    rest(cfg, "blog_post_redirects?select=old_slug,post:blog_posts(slug)"),
  ]);
  return {
    posts,
    categories,
    // RLS hides unpublished posts from the embed, so their redirects drop out here.
    redirects: redirects
      .filter((r) => r.post?.slug)
      .map((r) => ({ from: r.old_slug, to: r.post.slug })),
  };
}

const pageCount = (n) => Math.max(1, Math.ceil(n / BLOG_PAGE_SIZE));

/** Paths to prerender: index + pagination, every category (+ pagination), every post. */
export function blogPaths(data) {
  if (!data) return [];
  const paths = ["/blog"];
  for (let p = 2; p <= pageCount(data.posts.length); p++) paths.push(`/blog/page/${p}`);
  for (const c of data.categories) {
    paths.push(`/blog/category/${c.slug}`);
    const n = data.posts.filter((post) => post.category?.slug === c.slug).length;
    for (let p = 2; p <= pageCount(n); p++) paths.push(`/blog/category/${c.slug}/page/${p}`);
  }
  for (const post of data.posts) paths.push(`/blog/${post.slug}`);
  return paths;
}
