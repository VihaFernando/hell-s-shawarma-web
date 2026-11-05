// Public, read-only blog data access. Runs at build time (prerender) and in the
// browser on client-side navigation. Talks to Supabase's REST API directly with
// the publishable key instead of pulling supabase-js into the public bundle;
// Row Level Security only exposes published posts to this key anyway.

import { sanitizeHtml } from "./sanitize";
import { BLOG_PAGE_SIZE, type BlogCategory, type PostCard, type PostWithCategory } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const CATEGORY_EMBED = "category:blog_categories(id,slug,name)";
const CARD_FIELDS = `id,slug,title,excerpt,cover_image_url,cover_image_alt,cover_image_width,cover_image_height,published_at,updated_at,reading_minutes,${CATEGORY_EMBED}`;

async function rest<T>(path: string, init?: { count?: boolean }) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) are not set",
    );
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Accept: "application/json",
      ...(init?.count ? { Prefer: "count=exact" } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Blog API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as T;
  // Content-Range: "0-8/23"
  const total = Number(res.headers.get("content-range")?.split("/")[1] ?? NaN);
  return { data, total: Number.isFinite(total) ? total : 0 };
}

const publicFilter = () => `status=eq.published&published_at=lte.${new Date().toISOString()}`;

export async function fetchCategories() {
  const { data } = await rest<BlogCategory[]>(
    "blog_categories?select=*&order=sort_order.asc,name.asc",
  );
  return data;
}

export async function fetchPostList({
  page = 1,
  categorySlug,
}: {
  page?: number;
  categorySlug?: string;
}) {
  const from = (page - 1) * BLOG_PAGE_SIZE;
  const select = categorySlug
    ? CARD_FIELDS.replace(CATEGORY_EMBED, "category:blog_categories!inner(id,slug,name)")
    : CARD_FIELDS;
  const categoryFilter = categorySlug
    ? `&category.slug=eq.${encodeURIComponent(categorySlug)}`
    : "";
  const { data, total } = await rest<PostCard[]>(
    `blog_posts?select=${select}&${publicFilter()}${categoryFilter}` +
      `&order=published_at.desc&offset=${from}&limit=${BLOG_PAGE_SIZE}`,
    { count: true },
  );
  return { posts: data, total, pageCount: Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE)) };
}

export async function fetchPost(slug: string) {
  const { data } = await rest<PostWithCategory[]>(
    `blog_posts?select=*,${CATEGORY_EMBED}&slug=eq.${encodeURIComponent(slug)}&${publicFilter()}&limit=1`,
  );
  const post = data[0];
  // Stored HTML is never trusted: a member can write rows straight to Supabase, bypassing the editor.
  return post ? { ...post, content: sanitizeHtml(post.content) } : null;
}

// Same-category posts first, topped up with the latest posts.
export async function fetchRelatedPosts(post: PostWithCategory, limit = 3) {
  const base = `blog_posts?select=${CARD_FIELDS}&${publicFilter()}&id=neq.${post.id}&order=published_at.desc`;
  const sameCategory = post.category_id
    ? (await rest<PostCard[]>(`${base}&category_id=eq.${post.category_id}&limit=${limit}`)).data
    : [];
  if (sameCategory.length >= limit) return sameCategory;
  const exclude = [post.id, ...sameCategory.map((p) => p.id)].join(",");
  const { data: latest } = await rest<PostCard[]>(
    `blog_posts?select=${CARD_FIELDS}&${publicFilter()}&id=not.in.(${exclude})&order=published_at.desc&limit=${limit - sameCategory.length}`,
  );
  return [...sameCategory, ...latest];
}
