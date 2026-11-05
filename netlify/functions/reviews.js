// Netlify Function: GET /api/reviews
// Fetches the business's Google rating + reviews via the Places API (New) and
// caches the result in Netlify Blobs for 1 hour. Blobs is used (not an
// in-memory variable) because Netlify can spin up multiple concurrent function
// instances, each with its own memory — an in-memory cache would not reliably
// cap real Google API calls across instances the way a shared store does.

import { getStore } from "@netlify/blobs";

import { rateLimit } from "./lib/rate-limit.js";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BLOB_STORE = "reviews";
const BLOB_KEY = "google-place-reviews";

const RATE_LIMIT_MAX = 20; // per IP per minute; the Blobs cache is what protects the Google quota

export const handler = async (event) => {
  const headers = event.headers ?? {};
  const userAgent = headers["user-agent"] ?? headers["User-Agent"] ?? "";
  const origin = headers["origin"] ?? headers["Origin"] ?? "";
  const referer = headers["referer"] ?? headers["Referer"] ?? "";

  if (!isBrowserUserAgent(userAgent)) {
    return jsonResponse(403, { error: "forbidden", message: "Request rejected." });
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && !originMatches(allowedOrigin, origin, referer)) {
    return jsonResponse(403, { error: "forbidden", message: "Request rejected." });
  }

  // Shared across function instances (the old in-memory Map was per instance).
  if (await rateLimit(event, { name: "reviews", limit: RATE_LIMIT_MAX, windowSec: 60 })) {
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

  // If Blobs isn't available in this environment (e.g. missing site context),
  // degrade to "no cache" rather than failing the whole request.
  let store = null;
  try {
    store = getStore(BLOB_STORE);
  } catch (err) {
    console.error("Netlify Blobs unavailable, skipping cache:", err);
  }

  const cached = store ? await store.get(BLOB_KEY, { type: "json" }).catch(() => null) : null;
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
        "X-Goog-FieldMask":
          "rating,userRatingCount,reviews.authorAttribution,reviews.rating,reviews.text,reviews.originalText,reviews.relativePublishTimeDescription",
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
    authorPhotoUrl: r.authorAttribution?.photoUri ?? null,
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

  if (store) {
    await store.setJSON(BLOB_KEY, { data: result, fetchedAt: now }).catch((err) => {
      console.error("Failed to write reviews cache:", err);
    });
  }

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
