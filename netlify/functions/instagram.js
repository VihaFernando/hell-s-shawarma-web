// Netlify Function: GET /api/instagram
// Fetches the client's recent Instagram posts via the Graph API's Business
// Discovery endpoint (works with a token belonging to ANY IG business account
// linked to a Facebook app — no auth from the client account required) and
// caches the result in-memory for 1 hour so we don't hit the API on every load.

const { getStore } = require("@netlify/blobs");

const GRAPH_VERSION = "v25.0";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BLOB_STORE = "instagram";
const BLOB_KEY = "long-lived-token";

// Persists across warm invocations of the same function instance. Not shared
// across instances/regions, but that's fine for a "don't hammer the API" cache.
let cache = { data: null, fetchedAt: 0 };

exports.handler = async () => {
  const { IG_BUSINESS_ACCOUNT_ID, CLIENT_IG_USERNAME } = process.env;

  if (!IG_BUSINESS_ACCOUNT_ID || !CLIENT_IG_USERNAME) {
    return jsonResponse(500, {
      error: "server_misconfigured",
      message: "Missing required Instagram environment variables.",
    });
  }

  // Prefer the auto-refreshed token stored in Netlify Blobs; fall back to
  // the env var set at initial setup time.
  let accessToken;
  try {
    const store = getStore(BLOB_STORE);
    accessToken = (await store.get(BLOB_KEY)) ?? process.env.IG_LONG_LIVED_TOKEN;
  } catch {
    accessToken = process.env.IG_LONG_LIVED_TOKEN;
  }

  if (!accessToken) {
    return jsonResponse(500, {
      error: "server_misconfigured",
      message: "No Instagram access token available.",
    });
  }

  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return jsonResponse(200, { posts: cache.data, cached: true });
  }

  const fields = `business_discovery.username(${CLIENT_IG_USERNAME}){username,media_count,media{caption,media_url,permalink,timestamp,media_type}}`;
  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${IG_BUSINESS_ACCOUNT_ID}` +
    `?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    if (cache.data) return jsonResponse(200, { posts: cache.data, cached: true, stale: true });
    return jsonResponse(502, { error: "network_error", message: "Could not reach Instagram." });
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || body.error) {
    const code = body?.error?.code;
    const subcode = body?.error?.error_subcode;

    let errorType = "unknown_error";
    let message = "Failed to fetch Instagram data.";

    if (code === 190) {
      errorType = "token_expired";
      message = "The Instagram access token is invalid or expired. It needs to be refreshed.";
    } else if (code === 4 || code === 17 || code === 32) {
      errorType = "rate_limited";
      message = "Instagram API rate limit reached. Please try again later.";
    } else if (code === 100 && subcode === 33) {
      errorType = "account_not_found";
      message = `Could not find or access the Instagram account "${CLIENT_IG_USERNAME}". It may be private or the username may be wrong.`;
    }

    // Serve stale cache rather than a hard error if we have something.
    if (cache.data) {
      return jsonResponse(200, { posts: cache.data, cached: true, stale: true });
    }

    return jsonResponse(errorType === "rate_limited" ? 429 : 502, { error: errorType, message });
  }

  const media = body?.business_discovery?.media?.data ?? [];

  const posts = media
    .map((m) => ({
      caption: m.caption ?? "",
      media_url: m.media_url,
      permalink: m.permalink,
      timestamp: m.timestamp,
      media_type: m.media_type,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  cache = { data: posts, fetchedAt: now };

  return jsonResponse(200, { posts, cached: false });
};

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
