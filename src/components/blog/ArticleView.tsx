import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Flame, MapPin, ShoppingBag } from "lucide-react";

import { absoluteUrl } from "@/lib/seo";
import { BUSINESS } from "@/lib/site-info";
import { formatDate } from "@/lib/blog/format";
import { ARTICLE_COVER_ASPECT, responsiveImage } from "@/lib/blog/images";
import { categoryPath, postPath } from "@/lib/blog/seo";
import type { CategoryRef, FaqItem, PostCard as PostCardData, TocItem } from "@/lib/blog/types";

import { Breadcrumbs } from "./Breadcrumbs";
import { PostCard } from "./PostCard";
import { ReadingProgress } from "./ReadingProgress";
import { ShareButton } from "./ShareButton";

export type ArticleData = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  toc: TocItem[];
  faqs: FaqItem[];
  tags: string[];
  reading_minutes: number;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  author_name: string;
  published_at: string | null;
  updated_at: string;
  category: CategoryRef | null;
};

const DAY = 24 * 60 * 60 * 1000;

export function ArticleView({
  post,
  related = [],
  crumbs,
}: {
  post: ArticleData;
  related?: PostCardData[];
  crumbs: { name: string; path: string }[];
}) {
  const cover = post.cover_image_url
    ? responsiveImage(post.cover_image_url, [640, 960, 1280, 1600], {
        aspect: ARTICLE_COVER_ASPECT,
      })
    : null;
  const wasUpdated =
    post.published_at &&
    new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > DAY;
  const faqs = post.faqs.filter((f) => f.question.trim() && f.answer.trim());

  return (
    <>
      <ReadingProgress targetId="article-body" />
      <article className="mx-auto max-w-5xl px-5 lg:px-10 pt-8 md:pt-12 pb-16">
        <Breadcrumbs items={crumbs} />

        <header className="mt-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {post.category && (
              <Link
                to="/blog/category/$category"
                params={{ category: post.category.slug }}
                className="font-bold uppercase tracking-[0.08em] text-blog-accent hover:text-blog-link"
              >
                {post.category.name}
              </Link>
            )}
            {post.published_at && (
              <time
                dateTime={post.published_at}
                className="uppercase tracking-[0.06em] text-blog-fg/50"
              >
                {formatDate(post.published_at)}
              </time>
            )}
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-blog-fg sm:text-5xl md:text-6xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-blog-fg/75 md:text-xl">
              {post.excerpt}
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <div className="flex items-center gap-3">
              <img
                src="/apple-touch-icon.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-full bg-black ring-1 ring-blog-fg/15"
              />
              <span className="font-semibold text-blog-fg">By {post.author_name}</span>
            </div>
            <span className="h-4 w-px bg-blog-fg/20" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 text-blog-fg/70">
              <Clock className="h-4 w-4" aria-hidden="true" /> {post.reading_minutes} min read
            </span>
            {wasUpdated && (
              <>
                <span className="h-4 w-px bg-blog-fg/20" aria-hidden="true" />
                <span className="text-blog-fg/60">
                  Updated <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                </span>
              </>
            )}
            <span className="h-4 w-px bg-blog-fg/20" aria-hidden="true" />
            <ShareButton url={absoluteUrl(postPath(post.slug))} title={post.title} />
          </div>
        </header>

        {cover && (
          <figure className="mt-10">
            <img
              src={cover.src}
              srcSet={cover.srcSet}
              sizes="(min-width: 1024px) 960px, 100vw"
              alt={post.cover_image_alt || post.title}
              width={1600}
              height={800}
              fetchPriority="high"
              decoding="async"
              className="aspect-2/1 w-full rounded-2xl object-cover ring-1 ring-blog-fg/10"
            />
          </figure>
        )}

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div id="article-body" className="min-w-0 max-w-3xl">
            {post.toc.length >= 3 && (
              <nav
                aria-label="Table of contents"
                className="mb-10 rounded-xl border border-blog-fg/10 bg-blog-surface p-5 lg:hidden"
              >
                <TocList toc={post.toc} />
              </nav>
            )}

            <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.content }} />

            {faqs.length > 0 && (
              <section aria-labelledby="faq-heading" className="mt-14">
                <h2 id="faq-heading" className="text-3xl font-bold text-blog-fg">
                  Frequently asked questions
                </h2>
                <div className="mt-6 space-y-3">
                  {faqs.map((f) => (
                    <details
                      key={f.question}
                      className="group rounded-xl border border-blog-fg/10 bg-blog-surface px-5 py-4 open:border-[#ff3b14]/40"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-blog-fg">
                        <h3 className="text-base md:text-lg">{f.question}</h3>
                        <span
                          className="text-blog-accent text-xl transition-transform group-open:rotate-45"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-3 leading-relaxed text-blog-fg/75 whitespace-pre-line">
                        {f.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {post.tags.length > 0 && (
              <ul aria-label="Tags" className="mt-12 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-blog-fg/15 px-3 py-1 text-xs font-semibold text-blog-fg/70"
                  >
                    #{t}
                  </li>
                ))}
              </ul>
            )}

            <HungryCta />
          </div>

          {post.toc.length >= 3 && (
            <aside className="hidden lg:block">
              <nav aria-label="Table of contents" className="sticky top-28">
                <TocList toc={post.toc} />
              </nav>
            </aside>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-blog-fg/10">
          <div className="mx-auto max-w-7xl px-5 lg:px-10 py-16 md:py-20">
            <div className="flex items-end justify-between gap-4">
              <h2 id="related-heading" className="text-3xl font-extrabold text-blog-fg md:text-4xl">
                Keep reading
              </h2>
              <Link
                to={(post.category ? categoryPath(post.category.slug) : "/blog") as "/blog"}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blog-accent hover:gap-2.5 transition-all"
              >
                {post.category ? `More ${post.category.name}` : "All articles"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function TocList({ toc }: { toc: TocItem[] }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blog-fg/50">
        In this article
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {toc.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${item.id}`}
              className="text-blog-fg/70 hover:text-blog-link transition-colors"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}

function HungryCta() {
  return (
    <aside className="mt-14 overflow-hidden rounded-2xl border border-[#ff3b14]/30 bg-linear-to-br from-[#2a0a04] via-[#140806] to-[#0d0d0d] light:from-[#ffefe8] light:via-[#fff7f3] light:to-white p-7 md:p-9">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blog-accent">Hungry yet?</p>
      <p className="mt-2 text-2xl font-extrabold text-blog-fg md:text-3xl">
        Taste it for yourself at Hell's Shawarma.
      </p>
      <p className="mt-3 max-w-xl text-blog-fg/70">
        Flame-grilled shawarmas, hummus plates and loaded snack packs across four branches in
        Colombo and Dehiwala.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 rounded-md bg-[#ff3b14] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-[#ff5a2a] transition"
        >
          <Flame className="h-4 w-4" aria-hidden="true" /> View the menu
        </Link>
        <a
          href="/#contact"
          className="inline-flex items-center gap-2 rounded-md border border-blog-fg/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-blog-fg hover:border-blog-fg/50 transition"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" /> Find a branch
        </a>
        <a
          href={BUSINESS.uberEats}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-blog-fg/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-blog-fg hover:border-[#ff3b14] hover:text-blog-link transition"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Uber Eats
        </a>
      </div>
    </aside>
  );
}
