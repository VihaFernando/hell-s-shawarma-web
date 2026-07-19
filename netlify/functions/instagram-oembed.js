// Netlify Function: GET /api/instagram-oembed
// Fetches Instagram's oEmbed HTML for a fixed, manually-curated list of
// post/reel URLs (see src/config/featuredReels.js) using an App Access Token
// (client_credentials grant — no user/page token needed for oEmbed reads).
// Cached in Netlify Blobs for 24h since curated posts rarely change.

import { getStore } from "@netlify/blobs";
import { FEATURED_REELS } from "../../src/config/featuredReels.js";

const GRAPH_VERSION = "v25.0";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BLOB_STORE = "instagram-oembed";
const BLOB_KEY = "featured-reels";

let appTokenCache = { token: null, fetchedAt: 0 };
const APP_TOKEN_TTL_MS = 60 * 60 * 1000; // app tokens are long-lived; refetch hourly to be safe

async function getAppAccessToken() {
  const now = Date.now();
  if (appTokenCache.token && now - appTokenCache.fetchedAt < APP_TOKEN_TTL_MS) {
    return appTokenCache.token;
  }

  const { IG_APP_ID, IG_APP_SECRET } = process.env;
  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token` +
    `?client_id=${encodeURIComponent(IG_APP_ID)}` +
    `&client_secret=${encodeURIComponent(IG_APP_SECRET)}` +
    `&grant_type=client_credentials`;

  const res = await fetch(url);
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.access_token) {
    throw new Error(body?.error?.message ?? "Failed to obtain app access token.");
  }

  appTokenCache = { token: body.access_token, fetchedAt: now };
  return body.access_token;
}

async function fetchOembed(postUrl, appToken) {
  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/instagram_oembed` +
    `?url=${encodeURIComponent(postUrl)}&access_token=${encodeURIComponent(appToken)}`;

  const res = await fetch(url);
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.html) {
    return { url: postUrl, html: null, error: body?.error?.message ?? "Failed to fetch embed." };
  }

  return { url: postUrl, html: body.html, error: null };
}

export const handler = async () => {
  let store = null;
  try {
    store = getStore(BLOB_STORE);
  } catch (err) {
    console.error("Netlify Blobs unavailable, skipping cache:", err);
  }

  const cached = store ? await store.get(BLOB_KEY, { type: "json" }).catch(() => null) : null;
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return jsonResponse(200, { reels: cached.data, cached: true });
  }

  const { IG_APP_ID, IG_APP_SECRET } = process.env;
  if (!IG_APP_ID || !IG_APP_SECRET) {
    if (cached) return jsonResponse(200, { reels: cached.data, cached: true, stale: true });
    return jsonResponse(500, {
      error: "server_misconfigured",
      message: "Missing IG_APP_ID or IG_APP_SECRET.",
    });
  }

  let appToken;
  try {
    appToken = await getAppAccessToken();
  } catch (err) {
    if (cached) return jsonResponse(200, { reels: cached.data, cached: true, stale: true });
    return jsonResponse(502, { error: "auth_failed", message: "Could not authenticate with Instagram." });
  }

  const reels = await Promise.all(FEATURED_REELS.map((url) => fetchOembed(url, appToken)));

  if (store) {
    await store.setJSON(BLOB_KEY, { data: reels, fetchedAt: now }).catch((err) => {
      console.error("Failed to write oembed cache:", err);
    });
  }

  return jsonResponse(200, { reels, cached: false });
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
    body: JSON.stringify(payload),
  };
}
