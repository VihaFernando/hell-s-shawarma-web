// Shared helpers for the blog admin functions. Talks to Supabase over plain
// fetch (no SDK) so the functions stay tiny and dependency-free.
//
// Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY,
//      NETLIFY_BUILD_HOOK_URL

import { rateLimit } from "./rate-limit.js";

export const SITE_URL = "https://hellsshawarma.lk";

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(payload),
  };
}

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function supabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL;
  const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishable || !secret) {
    throw new HttpError(500, "Supabase environment variables are not configured.");
  }
  return { url, publishable, secret };
}

// Service-role REST call. The secret key bypasses RLS: server-side only.
export async function serviceRest(path, init = {}) {
  const { url, secret } = supabaseConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secret,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    // Upstream bodies can name tables/columns: log them, never return them.
    console.error(`Supabase ${res.status} on ${path.split("?")[0]}:`, await res.text());
    throw new HttpError(502, "Database request failed.");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Temporary passwords from an invite or reset stop working after this long.
export const INVITE_EXPIRES_DAYS = 7;

export const ALL_PERMISSIONS = [
  "posts.create",
  "posts.edit_all",
  "posts.publish",
  "posts.delete",
  "categories.manage",
  "site.rebuild",
  "users.manage",
];

/** Verifies the caller's Supabase session and returns the user (no membership check). */
export async function requireUser(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Missing session token.");

  const { url, publishable } = supabaseConfig();
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publishable, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new HttpError(401, "Session expired. Please sign in again.");
  return res.json();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the id if it is a UUID, else throws 400 (ids are interpolated into REST filters). */
export function requireUuid(id) {
  if (typeof id !== "string" || !UUID_RE.test(id)) throw new HttpError(400, "Invalid id.");
  return id;
}

/** JSON.parse that answers 400 instead of leaking a parser error as a 500. */
export function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}

export async function getMember(userId) {
  requireUuid(userId);
  const rows = await serviceRest(`blog_members?select=*&user_id=eq.${userId}`);
  return rows?.[0] ?? null;
}

/**
 * Verifies the session belongs to an active team member who has finished
 * onboarding and holds at least one of `anyOf` permissions (if given).
 */
export async function requireMember(event, anyOf = []) {
  const user = await requireUser(event);
  const member = await getMember(user.id);
  if (!member || member.disabled)
    throw new HttpError(403, "This account doesn't have blog access.");
  if (member.must_change_password) throw new HttpError(403, "Set a new password first.");
  if (anyOf.length && !anyOf.some((p) => member.permissions.includes(p))) {
    throw new HttpError(403, "You don't have permission to do that.");
  }
  return { user, member };
}

// ------------------------------------------------------------ Supabase Auth admin API

export async function authAdmin(path, init = {}) {
  const { url, secret } = supabaseConfig();
  const res = await fetch(`${url}/auth/v1/admin/${path}`, {
    ...init,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = body?.msg || body?.message || body?.error_description || `Auth API ${res.status}`;
    throw new HttpError(res.status === 422 || res.status === 400 ? 400 : 502, msg);
  }
  return body;
}

export async function getMeta(key) {
  const rows = await serviceRest(`blog_meta?select=value&key=eq.${encodeURIComponent(key)}`);
  return rows?.[0]?.value ?? null;
}

export async function setMeta(key, value) {
  await serviceRest("blog_meta?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
}

/** Fires the Netlify build hook so the static blog pages are regenerated. */
export async function triggerBuild(reason) {
  const hook = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!hook) throw new HttpError(500, "NETLIFY_BUILD_HOOK_URL is not configured.");
  const title = encodeURIComponent(`Blog: ${reason}`.slice(0, 120));
  const res = await fetch(`${hook}?trigger_title=${title}`, { method: "POST", body: "{}" });
  if (!res.ok) throw new HttpError(502, `Build hook failed with ${res.status}.`);
  const at = new Date().toISOString();
  await setMeta("last_build_trigger", { at, reason });
  return at;
}

// Per-IP default for every admin function; pass a tighter one for sensitive ones.
const DEFAULT_LIMIT = { name: "admin", limit: 120, windowSec: 60 };

/**
 * Wraps a handler: rate-limits per IP before any work (or Supabase call), and turns
 * HttpErrors into JSON responses. `limit` = { name, limit, windowSec }.
 */
export function withErrors(fn, limit = DEFAULT_LIMIT) {
  return async (event, context) => {
    try {
      const retryAfter = await rateLimit(event, limit);
      if (retryAfter) {
        const res = jsonResponse(429, { error: "Too many requests. Try again shortly." });
        res.headers["Retry-After"] = String(retryAfter);
        return res;
      }
      return await fn(event, context);
    } catch (err) {
      const status = err instanceof HttpError ? err.statusCode : 500;
      if (status >= 500) console.error(err);
      return jsonResponse(status, { error: err.message || "Unexpected error" });
    }
  };
}

export { HttpError };
