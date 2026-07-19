import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

interface GoogleReview {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number | null;
  text: string;
  relativeTime: string;
}

type ReviewsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      rating: number | null;
      totalReviews: number;
      reviews: GoogleReview[];
      reviewsUrl: string | null;
    };

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.77-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function Stars({ rating, className = "w-4 h-4" }: { rating: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${className} ${i < Math.round(rating) ? "fill-[#ff6a00] text-[#ff6a00]" : "fill-white/10 text-white/10"}`}
        />
      ))}
    </div>
  );
}

function Avatar({ review }: { review: GoogleReview }) {
  const [failed, setFailed] = useState(false);
  const initial = review.authorName.trim().charAt(0).toUpperCase() || "?";

  if (!review.authorPhotoUrl || failed) {
    return (
      <div className="w-11 h-11 shrink-0 rounded-full bg-[#ff3b14]/20 border border-[#ff3b14]/40 grid place-items-center text-[#ff6a00] font-bold text-sm">
        {initial}
      </div>
    );
  }

  return (
    <img
      src={review.authorPhotoUrl}
      alt={review.authorName}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-11 h-11 shrink-0 rounded-full object-cover border border-white/15"
    />
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 200;
  const displayText = expanded || !isLong ? review.text : `${review.text.slice(0, 200)}…`;

  return (
    <div className="glass-dark rounded-2xl border-white/10 p-6 flex flex-col w-80 sm:w-96 min-h-72 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar review={review} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{review.authorName}</div>
            {review.relativeTime && (
              <div className="text-xs text-white/40">{review.relativeTime}</div>
            )}
          </div>
        </div>
        <GoogleLogo className="w-5 h-5 shrink-0" />
      </div>
      {review.rating != null && <Stars rating={review.rating} />}
      {review.text && (
        <p className="mt-3 text-[15px] text-white leading-relaxed">
          {displayText}
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 text-[#ff6a00] font-semibold hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

function ReviewsCarousel({ reviews }: { reviews: GoogleReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Duplicate the list so the marquee can loop seamlessly; pause on
  // hover/touch so users can actually read a card if they want to.
  const loopReviews = reviews.length > 1 ? [...reviews, ...reviews] : reviews;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reviews.length <= 1) return;

    let raf: number;
    let x = 0;
    const speed = 0.25; // px per frame, roughly 15px/s at 60fps — slow enough to read comfortably

    const step = () => {
      if (!paused) {
        x -= speed;
        const resetPoint = -(track.scrollWidth / 2);
        if (x <= resetPoint) x = 0;
        track.style.transform = `translateX(${x}px)`;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, reviews.length]);

  if (reviews.length <= 1) {
    return (
      <div className="flex justify-center px-4">
        {reviews.map((review, i) => (
          <ReviewCard key={`${review.authorName}-${i}`} review={review} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div ref={trackRef} className="flex gap-5 w-max will-change-transform">
        {loopReviews.map((review, i) => (
          <ReviewCard key={`${review.authorName}-${i}`} review={review} />
        ))}
      </div>
    </div>
  );
}

export function GoogleReviews() {
  const [state, setState] = useState<ReviewsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/reviews")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) {
          throw new Error(body?.message ?? "Couldn't load reviews right now.");
        }
        return body as {
          rating: number | null;
          totalReviews: number;
          reviews: GoogleReview[];
          reviewsUrl: string | null;
        };
      })
      .then(({ rating, totalReviews, reviews, reviewsUrl }) => {
        if (!cancelled) setState({ status: "ready", rating, totalReviews, reviews, reviewsUrl });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div>
        <div className="flex justify-center mb-10">
          <div className="h-20 w-64 rounded-2xl bg-white/5 animate-pulse" />
        </div>
        <div className="flex justify-center gap-5 px-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 w-75 sm:w-85 shrink-0 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl glass-dark border-white/10 py-12 px-6 text-center">
        <Star className="w-8 h-8 mx-auto mb-3 text-white/40" />
        <p className="text-white/60 text-sm">{state.message}</p>
      </div>
    );
  }

  const { rating, totalReviews, reviews, reviewsUrl } = state;

  return (
    <div>
      {rating != null && (
        <a
          href={reviewsUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group mx-auto mb-12 flex w-fit flex-col items-center gap-2 rounded-2xl glass-dark border-white/10 px-8 py-6 sm:px-10 hover:border-[#ff3b14] transition-all duration-300"
        >
          <GoogleLogo className="w-8 h-8 mb-1" />
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display text-white">{rating.toFixed(1)}</span>
            <Stars rating={rating} className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50 group-hover:text-[#ff6a00] transition text-center">
            {totalReviews.toLocaleString()} Google Reviews
          </span>
        </a>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl glass-dark border-white/10 py-12 px-6 text-center">
          <Star className="w-8 h-8 mx-auto mb-3 text-white/40" />
          <p className="text-white/60 text-sm">No reviews to show yet.</p>
        </div>
      ) : (
        <ReviewsCarousel reviews={reviews} />
      )}

      {reviewsUrl && (
        <div className="mt-10 flex justify-center">
          <a
            href={reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[#ff3b14] px-8 py-3 text-sm font-bold tracking-[0.1em] uppercase text-white hover:bg-[#ff3b14] transition-all"
          >
            <GoogleLogo className="w-4 h-4" /> View All Reviews on Google
          </a>
        </div>
      )}
    </div>
  );
}
