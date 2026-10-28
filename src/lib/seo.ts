export const SITE_URL = "https://hellsshawarma.lk";

// Crawlers and social scrapers need fully-qualified URLs; Vite asset imports are root-relative.
export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

// Per-page canonical + og:url (and og:image when the page has its own share image).
export function pageSeo({ path, image }: { path: string; image?: string }) {
  const url = absoluteUrl(path);
  return {
    meta: [
      { property: "og:url", content: url },
      ...(image ? [{ property: "og:image", content: absoluteUrl(image) }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
