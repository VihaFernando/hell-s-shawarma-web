// Scheduled Netlify Function  runs automatically every 50 days (see the
// schedule in netlify.toml) to refresh the long-lived Instagram token and
// persist the new value in Netlify Blobs, so /api/instagram always reads the
// freshest token without any manual step.
//
// Netlify Blobs requires the `@netlify/blobs` package (already available in
// the Netlify Functions runtime, no extra setup needed beyond `npm install`).

import { getInstagramStore, BLOB_KEY } from "./lib/instagram-store.js";

const GRAPH_VERSION = "v25.0";

export const handler = async () => {
  const { IG_APP_ID, IG_APP_SECRET } = process.env;

  let store;
  try {
    store = getInstagramStore();
  } catch (err) {
    console.error("instagram-refresh-token-scheduled: getStore failed", err?.message ?? err);
    return;
  }

  // Prefer the last refreshed token if we have one, otherwise fall back to
  // the value baked into env vars (e.g. right after initial setup).
  let currentToken;
  try {
    currentToken = (await store.get(BLOB_KEY)) ?? process.env.IG_LONG_LIVED_TOKEN;
  } catch (err) {
    console.error("instagram-refresh-token-scheduled: store.get failed", err?.message ?? err);
    currentToken = process.env.IG_LONG_LIVED_TOKEN;
  }

  if (!IG_APP_ID || !IG_APP_SECRET || !currentToken) {
    console.error("instagram-refresh-token-scheduled: missing IG_APP_ID/IG_APP_SECRET/token");
    return;
  }

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token` +
    `?grant_type=fb_exchange_token&client_id=${encodeURIComponent(IG_APP_ID)}` +
    `&client_secret=${encodeURIComponent(IG_APP_SECRET)}` +
    `&fb_exchange_token=${encodeURIComponent(currentToken)}`;

  const res = await fetch(url);
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.access_token) {
    console.error("instagram-refresh-token-scheduled: refresh failed", body?.error ?? res.status);
    return;
  }

  try {
    await store.set(BLOB_KEY, body.access_token);
    console.log("instagram-refresh-token-scheduled: token refreshed and stored successfully");
  } catch (err) {
    console.error("instagram-refresh-token-scheduled: store.set failed", err?.message ?? err);
  }
};

export const config = {
  schedule: "@monthly", // Netlify only supports fixed presets/cron, not arbitrary day counts; see netlify.toml note.
};
