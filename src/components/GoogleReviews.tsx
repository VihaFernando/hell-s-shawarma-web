import { useEffect, useState } from "react";
import { Star, MessageSquareQuote } from "lucide-react";

interface GoogleReview {
  authorName: string;
  rating: number | null;
  text: string;
  relativeTime: string;
}

type ReviewsState =
  | { status: "loading" }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "ready";
      rating: number | null;
      totalReviews: number;
      reviews: GoogleReview[];
      reviewsUrl: string | null;
    };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? "fill-[#ff6a00] text-[#ff6a00]" : "fill-white/10 text-white/10"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > 220;
  const displayText = expanded || !isLong ? review.text : `${review.text.slice(0, 220)}…`;

  return (
    <div className="glass-dark rounded-2xl border-white/10 p-6 flex flex-col h-full">
      <MessageSquareQuote className="w-6 h-6 text-[#ff3b14]/60 mb-3 shrink-0" />
      {review.rating != null && <Stars rating={review.rating} />}
      {review.text && (
        <p className="mt-3 text-sm text-white/75 leading-relaxed flex-1">
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
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{review.authorName}</span>
        {review.relativeTime && (
          <span className="text-xs text-white/40">{review.relativeTime}</span>
        )}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse" />
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
          className="group mx-auto mb-12 flex w-fit flex-col items-center gap-2 rounded-2xl glass-dark border-white/10 px-10 py-6 hover:border-[#ff3b14] transition-all duration-300"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display text-white">{rating.toFixed(1)}</span>
            <Stars rating={rating} />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-white/50 group-hover:text-[#ff6a00] transition">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <ReviewCard key={`${review.authorName}-${i}`} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
