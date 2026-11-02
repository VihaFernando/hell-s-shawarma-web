// Shared loader/head/component for the four listing routes:
// /blog, /blog/page/$page, /blog/category/$category, /blog/category/$category/page/$page

import { notFound, redirect } from "@tanstack/react-router";

import outfitFont from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";
import { fetchCategories, fetchPostList } from "@/lib/blog/api";
import {
  BLOG_DESCRIPTION,
  BLOG_TITLE,
  blogPath,
  categoryPath,
  listingHead,
  ROBOTS_NOINDEX,
} from "@/lib/blog/seo";

import { BlogLayout } from "./BlogLayout";
import { BlogListing } from "./BlogListing";

export const blogFontPreload = {
  rel: "preload",
  href: outfitFont,
  as: "font",
  type: "font/woff2",
  crossOrigin: "anonymous",
} as const;

export function parsePageParam(raw: string, basePath: string) {
  const page = Number(raw);
  // /blog/page/1 and junk like /blog/page/abc collapse onto the canonical first page.
  if (!Number.isInteger(page) || page < 2) throw redirect({ href: basePath, statusCode: 301 });
  return page;
}

export async function loadListing({ page, categorySlug }: { page: number; categorySlug?: string }) {
  const [categories, list] = await Promise.all([
    fetchCategories(),
    fetchPostList({ page, categorySlug }),
  ]);
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
  if (categorySlug && !category) throw notFound();
  if (page > list.pageCount) throw notFound();
  return { categories, category, page, ...list };
}

type ListingData = Awaited<ReturnType<typeof loadListing>>;

export function listingRouteHead(data: ListingData | undefined) {
  if (!data)
    return {
      meta: [
        { title: "Page not found | Hell's Shawarma" },
        { name: "robots", content: ROBOTS_NOINDEX },
      ],
    };
  const { category, page, pageCount, posts } = data;
  const head = category
    ? listingHead({
        path: categoryPath(category.slug, page),
        title: category.seo_title || `${category.name} | ${BLOG_TITLE}`,
        description: category.seo_description || category.description || BLOG_DESCRIPTION,
        heading: category.name,
        page,
        pageCount,
        posts,
        category,
      })
    : listingHead({
        path: blogPath(page),
        title: "Shawarma Stories & Food Guides | Hell's Shawarma Blog",
        description: BLOG_DESCRIPTION,
        heading: BLOG_TITLE,
        page,
        pageCount,
        posts,
      });
  return { meta: head.meta, links: [...head.links, blogFontPreload] };
}

export function ListingPage({ data }: { data: ListingData }) {
  const { category, categories, posts, page, pageCount } = data;
  return (
    <BlogLayout>
      {category ? (
        <BlogListing
          kicker="Hell's Blog"
          heading={category.name}
          intro={category.description}
          categories={categories}
          activeCategory={category}
          posts={posts}
          page={page}
          pageCount={pageCount}
          crumbs={[
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: category.name, path: categoryPath(category.slug) },
          ]}
        />
      ) : (
        <BlogListing
          kicker={BLOG_TITLE}
          heading={
            <>
              Real Food.
              <br />
              <span className="text-blog-accent">Real Stories.</span>
            </>
          }
          intro="Shawarma stories, Middle Eastern food culture and guides to our branches in Colombo and Dehiwala."
          categories={categories}
          posts={posts}
          page={page}
          pageCount={pageCount}
        />
      )}
    </BlogLayout>
  );
}

export function BlogNotFound() {
  return (
    <BlogLayout>
      <div className="mx-auto max-w-2xl px-5 py-28 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blog-accent">404</p>
        <h1 className="mt-3 text-4xl font-extrabold text-blog-fg md:text-5xl">
          This page went up in smoke.
        </h1>
        <p className="mt-4 text-blog-fg/65">
          The article you're looking for doesn't exist or has moved.
        </p>
        <a
          href="/blog"
          className="mt-8 inline-flex rounded-md bg-[#ff3b14] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#ff5a2a]"
        >
          Back to the blog
        </a>
      </div>
    </BlogLayout>
  );
}
