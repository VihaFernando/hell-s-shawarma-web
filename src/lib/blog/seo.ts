import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLd,
  LOGO_URL,
  ORG_ID,
  SITE_NAME,
  WEBSITE_ID,
} from "../seo";
import defaultArticleImage from "@/assets/hero.png";

import { truncate } from "./format";
import { isCloudinary, ogImage, transformImage } from "./images";
import { BLOG_PAGE_SIZE, type BlogCategory, type PostCard, type PostWithCategory } from "./types";

export const BLOG_TITLE = "Hell's Shawarma Blog";
export const BLOG_DESCRIPTION =
  "Shawarma stories, Middle Eastern food culture, kitchen secrets and guides to every Hell's Shawarma branch in Colombo, Sri Lanka.";

export const ROBOTS_INDEX =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
export const ROBOTS_NOINDEX = "noindex, follow";

// Article/card images are served from Cloudinary; open the connection early for a faster LCP.
export const CLOUDINARY_PRECONNECT = {
  rel: "preconnect",
  href: "https://res.cloudinary.com",
} as const;

export const blogPath = (page = 1) => (page > 1 ? `/blog/page/${page}` : "/blog");
export const categoryPath = (slug: string, page = 1) =>
  page > 1 ? `/blog/category/${slug}/page/${page}` : `/blog/category/${slug}`;
export const postPath = (slug: string) => `/blog/${slug}`;

// A scheduled post can be saved long before it goes live; modified must never precede published.
export function postModifiedAt(post: Pick<PostWithCategory, "published_at" | "updated_at">) {
  if (!post.published_at) return post.updated_at;
  return new Date(post.published_at) > new Date(post.updated_at)
    ? post.published_at
    : post.updated_at;
}

export function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// The post's own URL isn't an override; storing it would drop the post from the sitemap.
export function canonicalOverride(value: string | null, slug: string) {
  if (!value) return null;
  const url = new URL(value);
  const own = new URL(absoluteUrl(postPath(slug)));
  const isOwnUrl =
    url.host.replace(/^www\./, "") === own.host && url.pathname.replace(/\/$/, "") === own.pathname;
  return isOwnUrl ? null : value;
}

export function postSeoTitle(post: Pick<PostWithCategory, "seo_title" | "title">) {
  return post.seo_title?.trim() || `${post.title} | ${SITE_NAME}`;
}

export function postSeoDescription(post: Pick<PostWithCategory, "seo_description" | "excerpt">) {
  return post.seo_description?.trim() || truncate(post.excerpt, 160);
}

function postShareImage(post: Pick<PostWithCategory, "og_image_url" | "cover_image_url">) {
  const src = post.og_image_url || post.cover_image_url;
  return src ? ogImage(src) : undefined;
}

// Google recommends 16:9, 4:3 and 1:1 variants (>= 1200px wide) for article rich results.
// Article rich results require an image, so posts without a cover fall back to the brand hero.
function articleImages(src: string | null) {
  if (!src) return [absoluteUrl(defaultArticleImage)];
  if (!isCloudinary(src)) return [src];
  return [
    transformImage(src, { width: 1200, height: 675, crop: "fill", format: "jpg" }),
    transformImage(src, { width: 1200, height: 900, crop: "fill", format: "jpg" }),
    transformImage(src, { width: 1200, height: 1200, crop: "fill", format: "jpg" }),
  ];
}

// A named writer must not reuse ORG_ID, or the graph gives the Organization two names.
function articleAuthor(name: string) {
  const author = name.trim();
  if (!author || author === SITE_NAME) {
    return { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: absoluteUrl("/") };
  }
  return { "@type": "Person", name: author };
}

export function postHead(post: PostWithCategory) {
  const url = absoluteUrl(postPath(post.slug));
  const canonical = post.canonical_url?.trim() || url;
  const title = postSeoTitle(post);
  const description = postSeoDescription(post);
  const image = postShareImage(post);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(post.category
      ? [{ name: post.category.name, path: categoryPath(post.category.slug) }]
      : []),
    { name: post.title, path: postPath(post.slug) },
  ];

  const blogPosting = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: truncate(post.title, 110),
    description,
    image: articleImages(post.cover_image_url),
    datePublished: post.published_at,
    dateModified: postModifiedAt(post),
    author: articleAuthor(post.author_name),
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    isPartOf: { "@type": "Blog", "@id": `${absoluteUrl("/blog")}#blog`, name: BLOG_TITLE },
    articleSection: post.category?.name,
    keywords: [post.focus_keyword, ...post.tags].filter(Boolean).join(", ") || undefined,
    wordCount: post.word_count || undefined,
    timeRequired: `PT${post.reading_minutes}M`,
    inLanguage: "en",
  };

  const faqs = post.faqs.filter((f) => f.question.trim() && f.answer.trim());

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "author", content: post.author_name.trim() || SITE_NAME },
      { name: "robots", content: post.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX },
      { property: "og:type", content: "article" },
      { property: "og:title", content: post.seo_title?.trim() || post.title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      ...(image
        ? [
            { property: "og:image", content: image },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
            { property: "og:image:alt", content: post.cover_image_alt || post.title },
          ]
        : []),
      { property: "article:published_time", content: post.published_at ?? "" },
      { property: "article:modified_time", content: postModifiedAt(post) },
      ...(post.category ? [{ property: "article:section", content: post.category.name }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: post.seo_title?.trim() || post.title },
      { name: "twitter:description", content: description },
      ...(image ? [{ name: "twitter:image", content: image }] : []),
      jsonLd(blogPosting),
      jsonLd(breadcrumbJsonLd(crumbs)),
      ...(faqs.length
        ? [
            jsonLd({
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            }),
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: canonical }, CLOUDINARY_PRECONNECT],
    crumbs,
  };
}

export function listingHead({
  path,
  title,
  description,
  heading,
  page,
  pageCount,
  posts,
  category,
}: {
  path: string;
  title: string;
  description: string;
  heading: string;
  page: number;
  pageCount: number;
  posts: PostCard[];
  category?: BlogCategory;
}) {
  const url = absoluteUrl(path);
  const fullTitle = page > 1 ? `${title} (Page ${page})` : title;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(category ? [{ name: category.name, path: categoryPath(category.slug) }] : []),
  ];
  const pagePath = (p: number) => (category ? categoryPath(category.slug, p) : blogPath(p));

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      // An empty listing is thin content; keep it out of the index until it has posts.
      { name: "robots", content: posts.length ? ROBOTS_INDEX : ROBOTS_NOINDEX },
      { property: "og:type", content: "website" },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      jsonLd({
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: heading,
        description,
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "en",
        ...(category
          ? {}
          : {
              about: {
                "@type": "Blog",
                "@id": `${absoluteUrl("/blog")}#blog`,
                name: BLOG_TITLE,
                publisher: { "@id": ORG_ID },
              },
            }),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: posts.map((p, i) => ({
            "@type": "ListItem",
            position: (page - 1) * BLOG_PAGE_SIZE + i + 1,
            url: absoluteUrl(postPath(p.slug)),
            name: p.title,
          })),
        },
      }),
      jsonLd(breadcrumbJsonLd(crumbs)),
    ],
    links: [
      { rel: "canonical", href: url },
      CLOUDINARY_PRECONNECT,
      ...(page > 1 ? [{ rel: "prev", href: absoluteUrl(pagePath(page - 1)) }] : []),
      ...(page < pageCount ? [{ rel: "next", href: absoluteUrl(pagePath(page + 1)) }] : []),
    ],
  };
}
