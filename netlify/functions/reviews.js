// Netlify Function: GET /api/reviews
// Fetches the business's Google rating + reviews via the Places API (New) and
// caches the result in Netlify Blobs for 1 hour. Blobs is used (not an
// in-memory variable) because Netlify can spin up multiple concurrent function
// instances, each with its own memory — an in-memory cache would not reliably
// cap real Google API calls across instances the way a shared store does.

import { getStore } from "@netlify/blobs";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BLOB_STORE = "reviews";
const BLOB_KEY = "google-place-reviews";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
// In-memory is fine here: this only needs to blunt abuse against a single warm
// instance, not enforce a global cap — the Blobs cache is what actually
// protects the Google API budget.
const requestLog = new Map();

export const handler = async (event) => {
  const headers = event.headers ?? {};
  const userAgent = headers["user-agent"] ?? headers["User-Agent"] ?? "";
  const origin = headers["origin"] ?? headers["Origin"] ?? "";
  const referer = headers["referer"] ?? headers["Referer"] ?? "";
  const clientIp =
    headers["x-nf-client-connection-ip"] ??
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
    "unknown";

  if (!isBrowserUserAgent(userAgent)) {
    return jsonResponse(403, { error: "forbidden", message: "Request rejected." });
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && !originMatches(allowedOrigin, origin, referer)) {
    return jsonResponse(403, { error: "forbidden", message: "Request rejected." });
  }

  if (isRateLimited(clientIp)) {
    return jsonResponse(429, {
      error: "rate_limited",
      message: "Too many requests. Please try again shortly.",
    });
  }

  const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID } = process.env;
  if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
    return jsonResponse(500, {
      error: "server_misconfigured",
      message: "Missing required Google Places environment variables.",
    });
  }

  const store = getStore(BLOB_STORE);

  const cached = await store.get(BLOB_KEY, { type: "json" }).catch(() => null);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return jsonResponse(200, { ...cached.data, cached: true });
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(GOOGLE_PLACE_ID)}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
    });
  } catch {
    if (cached) return jsonResponse(200, { ...cached.data, cached: true, stale: true });
    return jsonResponse(502, { error: "network_error", message: "Could not reach Google Places." });
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || body.error) {
    const status = body?.error?.status;

    let errorType = "unknown_error";
    let message = "Failed to fetch Google reviews.";

    if (res.status === 403 || status === "PERMISSION_DENIED") {
      errorType = "invalid_key";
      message = "The Google Places API key is invalid or lacks permission.";
    } else if (res.status === 404 || status === "NOT_FOUND") {
      errorType = "place_not_found";
      message = "The configured Google Place ID could not be found.";
    } else if (res.status === 429 || status === "RESOURCE_EXHAUSTED") {
      errorType = "rate_limited";
      message = "Google Places API quota reached. Please try again later.";
    }

    if (cached) {
      return jsonResponse(200, { ...cached.data, cached: true, stale: true });
    }

    return jsonResponse(errorType === "rate_limited" ? 429 : 502, { error: errorType, message });
  }

  const reviews = (body.reviews ?? []).map((r) => ({
    authorName: r.authorAttribution?.displayName ?? "Anonymous",
    rating: r.rating ?? null,
    text: r.text?.text ?? r.originalText?.text ?? "",
    relativeTime: r.relativePublishTimeDescription ?? "",
  }));

  const result = {
    rating: body.rating ?? null,
    totalReviews: body.userRatingCount ?? 0,
    reviews,
    reviewsUrl: `https://search.google.com/local/reviews?placeid=${encodeURIComponent(GOOGLE_PLACE_ID)}`,
  };

  await store.setJSON(BLOB_KEY, { data: result, fetchedAt: now });

  return jsonResponse(200, { ...result, cached: false });
};

function isBrowserUserAgent(userAgent) {
  if (!userAgent || userAgent.length < 10) return false;
  // Reject empty/script-like UAs (curl, python-requests, etc.) while staying
  // permissive enough not to false-positive on real browsers.
  const botLike = /^(curl|wget|python|go-http|axios|node-fetch|postman|scrapy)/i;
  return !botLike.test(userAgent) && /mozilla|chrome|safari|firefox|edg|opera/i.test(userAgent);
}

function originMatches(allowedOrigin, origin, referer) {
  const allowedHost = safeHost(allowedOrigin);
  if (!allowedHost) return true; // misconfigured allowlist shouldn't hard-lock the endpoint

  const originHost = safeHost(origin);
  if (originHost) return originHost === allowedHost;

  const refererHost = safeHost(referer);
  if (refererHost) return refererHost === allowedHost;

  // No Origin/Referer at all (e.g. direct navigation, some same-site
  // requests) — allow rather than block legitimate first-party traffic.
  return true;
}

function safeHost(value) {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function isRateLimited(clientIp) {
  const now = Date.now();
  const entry = requestLog.get(clientIp);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestLog.set(clientIp, { windowStart: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
    body: JSON.stringify(payload),
  };
}
