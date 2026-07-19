// Curated list of influencer reels shown in the "INFLUENCER REELS" homepage
// section. Each entry pairs a Cloudinary-hosted video (public ID, from
// https://cloudinary.com/console) with the original Instagram post it's
// posted on — clicking a tile opens instagramUrl in a new tab.
// Add, remove, or reorder entries here; no other code needs to change.
export interface FeaturedReel {
  /** Cloudinary public ID, e.g. "v1784470011/reel1_bk1glv" */
  cloudinaryPublicId: string;
  /** Instagram post/reel permalink to open when the tile is clicked */
  instagramUrl: string;
}

export const FEATURED_REELS: FeaturedReel[] = [
  {
    cloudinaryPublicId: "v1784470011/reel1_bk1glv",
    instagramUrl: "https://www.instagram.com/reel/DQ_bqlxAd7x/",
  },
  {
    cloudinaryPublicId: "v1784470011/reel2_jzkyen",
    instagramUrl: "https://www.instagram.com/reel/DZFR1IMqfyi/",
  },
  {
    cloudinaryPublicId: "v1784470007/reel3_brjh7c",
    instagramUrl: "https://www.instagram.com/reel/DaH8F3AOanl/",
  },
];
