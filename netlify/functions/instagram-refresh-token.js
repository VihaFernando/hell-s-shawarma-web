// Netlify Function: /api/instagram-refresh-token
// Extends the long-lived Instagram token by another ~60 days.
// Callable manually (GET request) or via a scheduled Netlify Function on the same file
// using the `netlify/functions/instagram-refresh-token-scheduled.js` companion below.
//
// IMPORTANT: This does NOT persist the new token anywhere by itself — see the
// scheduled variant for how it's stored (Netlify Blobs).

const GRAPH_VERSION = "v25.0";

exports.handler = async () => {
  const { IG_APP_ID, IG_APP_SECRET, IG_LONG_LIVED_TOKEN } = process.env;

  if (!IG_APP_ID || !IG_APP_SECRET || !IG_LONG_LIVED_TOKEN) {
    return jsonResponse(500, {
      error: "server_misconfigured",
      message: "Missing IG_APP_ID, IG_APP_SECRET, or IG_LONG_LIVED_TOKEN.",
    });
  }

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token` +
    `?grant_type=fb_exchange_token&client_id=${encodeURIComponent(IG_APP_ID)}` +
    `&client_secret=${encodeURIComponent(IG_APP_SECRET)}` +
    `&fb_exchange_token=${encodeURIComponent(IG_LONG_LIVED_TOKEN)}`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    return jsonResponse(502, { error: "network_error", message: "Could not reach Facebook Graph API." });
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.access_token) {
    return jsonResponse(502, {
      error: "refresh_failed",
      message: body?.error?.message ?? "Token refresh failed.",
    });
  }

  return jsonResponse(200, {
    access_token: body.access_token,
    expires_in: body.expires_in,
    message:
      "Token refreshed successfully. NOTE: this response is not persisted anywhere — " +
      "update IG_LONG_LIVED_TOKEN wherever your app reads it from.",
  });
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}
