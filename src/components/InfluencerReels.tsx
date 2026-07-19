import { useEffect, useRef } from "react";
import { FEATURED_REELS, type FeaturedReel } from "@/config/featuredReels";

const CLOUD_NAME = "di3xtilio";

// f_auto lets Cloudinary pick the smallest codec the requesting browser
// supports (e.g. AV1/VP9 over H.264); q_auto tunes quality/size automatically.
function cloudinaryVideoUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto,q_auto/${publicId}`;
}

function ReelTile({ reel }: { reel: FeaturedReel }) {
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
    <a
      href={reel.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative aspect-9/16 w-full max-w-70 sm:max-w-none mx-auto block rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff3b14] transition-all duration-300"
    >
      <video
        ref={videoRef}
        src={cloudinaryVideoUrl(reel.cloudinaryPublicId)}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    </a>
  );
}

export function InfluencerReels() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
      {FEATURED_REELS.map((reel) => (
        <ReelTile key={reel.cloudinaryPublicId} reel={reel} />
      ))}
    </div>
  );
}
