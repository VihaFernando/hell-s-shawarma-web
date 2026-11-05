// Shared fixed-window rate limiter backed by Netlify Blobs, so the count holds
// across concurrent function instances (an in-memory Map does not).
//
// ponytail: Blobs has no atomic increment, so simultaneous requests can slip a
// few extra calls past the limit. Fine for abuse control; use a real counter
// (Redis, Supabase RPC) if exact limits ever matter.
// If Blobs is unreachable it falls back to per-instance memory rather than
// blocking real users.

import { getStore } from "@netlify/blobs";

const memory = new Map();

function blobs() {
  const { BLOBS_SITE_ID, BLOBS_TOKEN } = process.env;
  try {
    return BLOBS_SITE_ID && BLOBS_TOKEN
      ? getStore({ name: "ratelimit", siteID: BLOBS_SITE_ID, token: BLOBS_TOKEN })
      : getStore("ratelimit");
  } catch {
    return null;
  }
}

/** Netlify sets x-nf-client-connection-ip itself; x-forwarded-for is client-controllable. */
export function clientIp(event) {
  const h = event.headers ?? {};
  return h["x-nf-client-connection-ip"] || h["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
}

const keyFor = (name, id) => `${name}/${String(id).replace(/[^\w.:-]/g, "_")}`;

/** Forgets a counter (e.g. failed logins after a successful one). */
export async function resetRateLimit(name, id) {
  const key = keyFor(name, id);
  memory.delete(key);
  await blobs()
    ?.delete(key)
    .catch(() => {});
}

/**
 * Counts one request for `name` + `id` (default: caller IP). Returns 0 if allowed,
 * otherwise the number of seconds until the window resets.
 * `peek: true` only checks (blocked once `limit` hits are already recorded) without counting.
 */
export async function rateLimit(event, { name, limit, windowSec, id, peek = false }) {
  const key = keyFor(name, id ?? clientIp(event));
  const now = Date.now();
  const store = blobs();

  let rec = null;
  let useMemory = !store;
  if (store) {
    try {
      rec = await store.get(key, { type: "json" });
    } catch (err) {
      console.error("rate-limit: Blobs read failed, using memory", err?.message ?? err);
      useMemory = true;
    }
  }
  if (useMemory) rec = memory.get(key) ?? null;

  if (!rec || now - rec.w >= windowSec * 1000) rec = { w: now, n: 0 };
  const retry = Math.max(1, Math.ceil((rec.w + windowSec * 1000 - now) / 1000));
  if (peek) return rec.n >= limit ? retry : 0;
  rec.n += 1;

  if (useMemory) {
    memory.set(key, rec);
  } else {
    await store.setJSON(key, rec).catch((err) => {
      console.error("rate-limit: Blobs write failed", err?.message ?? err);
    });
  }

  return rec.n > limit ? retry : 0;
}
