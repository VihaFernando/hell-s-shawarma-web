import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import fallbackCover from "@/assets/blog-hero-sm.webp";
import { formatDate } from "@/lib/blog/format";
import { CARD_COVER_ASPECT, responsiveImage } from "@/lib/blog/images";
import type { PostCard as PostCardData } from "@/lib/blog/types";

export function PostCard({ post, eager = false }: { post: PostCardData; eager?: boolean }) {
  const img = post.cover_image_url
    ? responsiveImage(post.cover_image_url, [400, 640, 960], { aspect: CARD_COVER_ASPECT })
    : { src: fallbackCover };

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-blog-surface ring-1 ring-blog-fg/10">
        <img
          src={img.src}
          srcSet={img.srcSet}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          alt={post.cover_image_alt || post.title}
          width={640}
          height={400}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.08em]">
        {post.category ? (
          <Link
            to="/blog/category/$category"
            params={{ category: post.category.slug }}
            className="relative z-10 text-blog-accent hover:text-blog-link"
          >
            {post.category.name}
          </Link>
        ) : (
          <span />
        )}
        <time dateTime={post.published_at ?? undefined} className="text-blog-fg/45">
          {formatDate(post.published_at)}
        </time>
      </div>
      <h3 className="mt-2.5 text-xl font-bold leading-snug text-blog-fg">
        {/* Stretched link: the whole card is clickable, but there's one link per card for crawlers/screen readers. */}
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="after:absolute after:inset-0 hover:text-blog-link transition-colors"
        >
          {post.title}
        </Link>
      </h3>
      {post.excerpt && (
        <p className="mt-2 text-sm leading-relaxed text-blog-fg/60 line-clamp-3">{post.excerpt}</p>
      )}
      <span
        aria-hidden="true"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blog-accent group-hover:gap-2.5 transition-all"
      >
        Read Article <ArrowRight className="h-4 w-4" />
      </span>
    </article>
  );
}
