import { useEffect, useRef } from "react";

const CLOUD_NAME = "di3xtilio";

// f_auto lets Cloudinary pick the smallest codec the requesting browser
// supports (e.g. AV1/VP9 over H.264); q_auto tunes quality/size automatically.
function cloudinaryVideoUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/f_auto,q_auto/${publicId}`;
}

const REELS = [
  cloudinaryVideoUrl("v1784470011/reel1_bk1glv"),
  cloudinaryVideoUrl("v1784470011/reel2_jzkyen"),
  cloudinaryVideoUrl("v1784470007/reel3_brjh7c"),
];

function ReelTile({ src }: { src: string }) {
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
    <div className="relative aspect-9/16 w-full max-w-70 sm:max-w-none mx-auto rounded-2xl overflow-hidden border border-white/10">
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function InfluencerReels() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
      {REELS.map((src, i) => (
        <ReelTile key={i} src={src} />
      ))}
    </div>
  );
}
