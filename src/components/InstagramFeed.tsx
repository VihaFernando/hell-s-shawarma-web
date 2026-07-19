import { useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";

interface InstagramPost {
  caption: string;
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  timestamp: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
}

type FeedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; posts: InstagramPost[]; profilePictureUrl: string | null };

function VideoTile({ post }: { post: InstagramPost }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={post.media_url}
      poster={post.thumbnail_url ?? undefined}
      muted
      loop
      playsInline
      preload="metadata"
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

export function InstagramFeed({ limit = 6 }: { limit?: number }) {
  const [state, setState] = useState<FeedState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/instagram")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.posts) {
          throw new Error(body?.message ?? "Couldn't load Instagram posts right now.");
        }
        return body as { posts: InstagramPost[]; profilePictureUrl: string | null };
      })
      .then(({ posts, profilePictureUrl }) => {
        if (!cancelled) setState({ status: "ready", posts, profilePictureUrl });
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl glass-dark border-white/10 py-12 px-6 text-center">
        <Instagram className="w-8 h-8 mx-auto mb-3 text-white/40" />
        <p className="text-white/60 text-sm">{state.message}</p>
      </div>
    );
  }

  const posts = state.posts.slice(0, limit);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl glass-dark border-white/10 py-12 px-6 text-center">
        <Instagram className="w-8 h-8 mx-auto mb-3 text-white/40" />
        <p className="text-white/60 text-sm">No posts to show yet.</p>
      </div>
    );
  }

  return (
    <div>
      {state.profilePictureUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={state.profilePictureUrl}
            alt="Instagram profile"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#ff3b14]"
          />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {posts.map((post) => (
          <a
            key={post.permalink}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 hover:border-[#ff3b14] transition-all duration-300"
          >
            {post.media_type === "VIDEO" ? (
              <VideoTile post={post} />
            ) : (
              <img
                src={post.media_url}
                alt={post.caption ? post.caption.slice(0, 100) : "Instagram post"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              {post.caption && (
                <p className="text-xs text-white/90 line-clamp-3">{post.caption}</p>
              )}
            </div>
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Instagram className="w-3.5 h-3.5 text-white" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
