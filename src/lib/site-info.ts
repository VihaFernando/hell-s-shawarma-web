// Business facts shared by the footer, blog CTAs and structured data (JSON-LD).
// Keep these in sync with Google Business Profile: consistent name/address/phone
// across the web is a local-SEO ranking signal.

export const BUSINESS = {
  name: "Hell's Shawarma",
  legalName: "Hell's Shawarma & Grill",
  phoneDisplay: "072 320 5285",
  phoneE164: "+94723205285",
  email: "hells.shawarma@gmail.com",
  cuisine: ["Middle Eastern", "Mediterranean", "Shawarma"],
  uberEats: "https://www.ubereats.com/lk/store/hells-shawarma-%26-grill/ZM3tJn6fRe-RtiSWcW0rdA",
  social: {
    instagram: "https://www.instagram.com/hells_shawarma/",
    facebook: "https://www.facebook.com/p/Hells-Shawarma-61569893127389/",
    tiktok: "https://www.tiktok.com/discover/hells-shawarma?is_from_webapp=1&sender_device=pc",
  },
} as const;

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const EVERY_DAY: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export type BranchHours = { days: Day[]; opens: string; closes: string }[];

export const BRANCHES: {
  id: string;
  name: string;
  address: string;
  locality: string;
  geo: { lat: number; lng: number };
  hours: BranchHours;
}[] = [
  {
    id: "dehiwala",
    name: "Dehiwala",
    address: "Fusion Food Court, Dehiwala",
    locality: "Dehiwala-Mount Lavinia",
    geo: { lat: 6.8622975, lng: 79.8614815 },
    hours: [{ days: EVERY_DAY, opens: "14:30", closes: "01:00" }],
  },
  {
    id: "kollupitiya",
    name: "Kollupitiya",
    address: "Hey Marine, Marine Drive, Colombo 3",
    locality: "Colombo",
    geo: { lat: 6.908404, lng: 79.846594 },
    hours: [
      { days: ["Friday", "Saturday", "Sunday"], opens: "17:00", closes: "01:00" },
      { days: ["Tuesday", "Wednesday", "Thursday"], opens: "17:00", closes: "00:30" },
    ],
  },
  {
    id: "bamba-food-square",
    name: "Bamba Food Square",
    address: "Bamba Food Square, Colombo 4",
    locality: "Colombo",
    geo: { lat: 6.8845022, lng: 79.8559609 },
    hours: [{ days: EVERY_DAY, opens: "14:30", closes: "01:00" }],
  },
  {
    id: "pink-beach",
    name: "Pink Beach",
    address: "Pink Beach, Marine Drive, Colombo 4",
    locality: "Colombo",
    geo: { lat: 6.8844291, lng: 79.8527519 },
    hours: [{ days: EVERY_DAY, opens: "14:30", closes: "01:00" }],
  },
];
