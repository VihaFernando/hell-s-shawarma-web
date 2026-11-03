import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import heroImage from "@/assets/blog-hero.webp";
import heroImageSm from "@/assets/blog-hero-sm.webp";
import { blogPath, categoryPath } from "@/lib/blog/seo";
import type { BlogCategory, PostCard as PostCardData } from "@/lib/blog/types";

import { Breadcrumbs } from "./Breadcrumbs";
import { PostCard } from "./PostCard";

type Props = {
  kicker: string;
  heading: ReactNode;
  intro: string;
  categories: BlogCategory[];
  activeCategory?: BlogCategory;
  posts: PostCardData[];
  page: number;
  pageCount: number;
  crumbs?: { name: string; path: string }[];
};

export function BlogListing({
  kicker,
  heading,
  intro,
  categories,
  activeCategory,
  posts,
  page,
  pageCount,
  crumbs,
}: Props) {
  const pathFor = (p: number) =>
    activeCategory ? categoryPath(activeCategory.slug, p) : blogPath(p);

  return (
    <>
      <ListingHero kicker={kicker} heading={heading} intro={intro} crumbs={crumbs} />

      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <nav aria-label="Blog categories" className="border-b border-blog-fg/10">
          <ul className="-mb-px flex gap-8 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
            <li>
              <CategoryTab to="/blog" active={!activeCategory}>
                All
              </CategoryTab>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <CategoryTab to={categoryPath(c.slug)} active={activeCategory?.id === c.id}>
                  {c.name}
                </CategoryTab>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Articles" className="py-12 md:py-16">
          {posts.length ? (
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <PostCard key={post.id} post={post} eager={i < 3} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-2xl font-bold text-blog-fg">Fresh stories are on the grill.</p>
              <p className="mt-3 text-blog-fg/60">
                Nothing here yet. Check back soon, or{" "}
                <Link to="/menu" className="text-blog-link underline underline-offset-4">
                  browse the menu
                </Link>{" "}
                while you wait.
              </p>
            </div>
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
              {page > 1 && (
                <PageLink to={pathFor(page - 1)} label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </PageLink>
              )}
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <PageLink key={p} to={pathFor(p)} current={p === page} label={`Page ${p}`}>
                  {p}
                </PageLink>
              ))}
              {page < pageCount && (
                <PageLink to={pathFor(page + 1)} label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </PageLink>
              )}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}

// Shown only during client-side navigation while the loader fetches from Supabase.
// Prerendered HTML (what crawlers get) always contains the real listing.
export function BlogListingSkeleton(hero: Pick<Props, "kicker" | "heading" | "intro" | "crumbs">) {
  return (
    <>
      <ListingHero {...hero} />

      <div
        className="mx-auto max-w-7xl px-5 lg:px-10"
        aria-busy="true"
        aria-label="Loading articles"
      >
        <div className="flex gap-8 border-b border-blog-fg/10 py-4">
          {[10, 20, 16, 24].map((w) => (
            <div
              key={w}
              className="h-5 animate-pulse rounded bg-blog-fg/10"
              style={{ width: `${w * 4}px` }}
            />
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-14 py-12 sm:grid-cols-2 md:py-16 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-16/10 animate-pulse rounded-xl bg-blog-fg/10" />
              <div className="mt-4 flex justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-blog-fg/10" />
                <div className="h-3 w-16 animate-pulse rounded bg-blog-fg/10" />
              </div>
              <div className="mt-3 h-6 w-11/12 animate-pulse rounded bg-blog-fg/10" />
              <div className="mt-2 h-6 w-2/3 animate-pulse rounded bg-blog-fg/10" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-blog-fg/10" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-blog-fg/10" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ListingHero({
  kicker,
  heading,
  intro,
  crumbs,
}: Pick<Props, "kicker" | "heading" | "intro" | "crumbs">) {
  return (
    <section className="relative overflow-hidden">
      {/* Dark: full-bleed photo fading into the page. Light: the (dark) photo becomes a
          framed card beside the headline, since fading it into cream looks muddy. */}
      <div className="absolute inset-0 light:mx-auto light:max-w-7xl">
        <picture>
          <source media="(max-width: 767px)" srcSet={heroImageSm} />
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            width={1200}
            height={800}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-y-0 right-0 h-full w-full md:w-[70%] object-cover object-right opacity-60 md:opacity-100 light:max-md:hidden light:top-12 light:right-5 light:h-[calc(100%-6rem)] light:w-[40%] light:rounded-[28px] light:object-[72%_center] light:opacity-100 light:shadow-[0_30px_70px_-25px_rgba(90,30,10,0.45)] light:ring-1 light:ring-black/5 light:lg:right-10"
          />
        </picture>
      </div>
      <div className="absolute inset-0 bg-linear-to-r from-blog-bg via-blog-bg/85 md:via-blog-bg/60 to-transparent light:hidden" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-blog-bg to-transparent light:hidden" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-10 pt-14 pb-16 md:pt-20 md:pb-24 light:md:pr-[46%] light:lg:pr-[46%]">
        {crumbs && (
          <div className="mb-8">
            <Breadcrumbs items={crumbs} />
          </div>
        )}
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blog-accent">{kicker}</p>
        <h1 className="mt-4 max-w-2xl text-5xl font-extrabold leading-[1.02] tracking-tight text-blog-fg md:text-7xl">
          {heading}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-blog-fg/75">{intro}</p>
      </div>
    </section>
  );
}

function CategoryTab({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to as "/blog"}
      aria-current={active ? "page" : undefined}
      className={`inline-block border-b-2 py-4 text-sm transition-colors ${
        active
          ? "border-[#ff3b14] font-bold text-blog-accent"
          : "border-transparent text-blog-fg/70 hover:text-blog-fg"
      }`}
    >
      {children}
    </Link>
  );
}

function PageLink({
  to,
  current,
  label,
  children,
}: {
  to: string;
  current?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to as "/blog"}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={`grid h-10 min-w-10 place-items-center rounded-md px-3 text-sm font-bold transition ${
        current
          ? "bg-[#ff3b14] text-white"
          : "border border-blog-fg/15 text-blog-fg/75 hover:border-[#ff3b14] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
