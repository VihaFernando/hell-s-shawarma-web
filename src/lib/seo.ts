import type { JSX } from "react";

import { BRANCHES, BUSINESS } from "./site-info";

export const SITE_URL = "https://hellsshawarma.lk";
export const SITE_NAME = BUSINESS.name;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
// Square, opaque logo; Google requires >= 112x112 for Organization logos.
export const LOGO_URL = `${SITE_URL}/apple-touch-icon.png`;

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

type JsonLd = Record<string, unknown>;

// TanStack's HeadContent renders `script:ld+json` entries as escaped <script type="application/ld+json">.
// The entry is a supported runtime shape that the meta element typing doesn't model, hence the cast.
export function jsonLd(data: JsonLd) {
  return {
    "script:ld+json": { "@context": "https://schema.org", ...data },
  } as JSX.IntrinsicElements["meta"];
}

export function organizationJsonLd(): JsonLd {
  return {
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: BUSINESS.name,
        legalName: BUSINESS.legalName,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: LOGO_URL, width: 180, height: 180 },
        email: BUSINESS.email,
        telephone: BUSINESS.phoneE164,
        sameAs: Object.values(BUSINESS.social),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: BUSINESS.name,
        publisher: { "@id": ORG_ID },
        inLanguage: "en",
      },
    ],
  };
}

// One Restaurant entity per branch so each can surface in local results.
export function restaurantsJsonLd(image: string): JsonLd {
  return {
    "@graph": BRANCHES.map((b) => ({
      "@type": "Restaurant",
      "@id": `${SITE_URL}/#branch-${b.id}`,
      name: `${BUSINESS.name} ${b.name}`,
      url: SITE_URL,
      image: absoluteUrl(image),
      telephone: BUSINESS.phoneE164,
      servesCuisine: BUSINESS.cuisine,
      hasMenu: absoluteUrl("/menu"),
      acceptsReservations: false,
      parentOrganization: { "@id": ORG_ID },
      address: {
        "@type": "PostalAddress",
        streetAddress: b.address,
        addressLocality: b.locality,
        addressCountry: "LK",
      },
      geo: { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng },
      openingHoursSpecification: b.hours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days,
        opens: h.opens,
        closes: h.closes,
      })),
      potentialAction: {
        "@type": "OrderAction",
        target: BUSINESS.uberEats,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
