// Shared helper for netlify/functions/instagram.js and
// instagram-refresh-token-scheduled.js.
//
// Netlify is supposed to auto-inject Blobs credentials (siteID/token) into
// every function invocation, but Scheduled Functions on some sites don't
// reliably get that context. When BLOBS_SITE_ID/BLOBS_TOKEN are set (a
// Netlify Personal Access Token), we pass them explicitly instead of relying
// on auto-injection.

import { getStore } from "@netlify/blobs";

export const BLOB_STORE = "instagram";
export const BLOB_KEY = "long-lived-token";

export function getInstagramStore() {
  const { BLOBS_SITE_ID, BLOBS_TOKEN } = process.env;

  if (BLOBS_SITE_ID && BLOBS_TOKEN) {
    return getStore({ name: BLOB_STORE, siteID: BLOBS_SITE_ID, token: BLOBS_TOKEN });
  }

  return getStore(BLOB_STORE);
}
