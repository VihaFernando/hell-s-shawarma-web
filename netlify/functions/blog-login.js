// Netlify Function: POST /api/blog-login { email, password }
// Password sign-in for the blog admin, with brute-force protection the browser
// can't provide on its own:
//   * per IP:      20 attempts / 15 min (withErrors)
//   * per account: locked for the rest of a 15 min window after 8 failures,
//                  whoever the caller is, so a botnet can't spread guesses over many IPs.
// Success returns the Supabase session; the browser adopts it with setSession().
//
// NOTE: the Supabase Auth endpoint itself is still reachable with the public key.
// To make this limit binding for everyone, also enable CAPTCHA protection in
// Supabase (Authentication > Attack Protection).

import { createHash } from "node:crypto";

import { HttpError, jsonResponse, parseBody, withErrors } from "./lib/blog-admin.js";
import { rateLimit, resetRateLimit } from "./lib/rate-limit.js";

const FAIL = { name: "login-fail", limit: 8, windowSec: 900 };

export const handler = withErrors(
  async (event) => {
    if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

    const { email, password } = parseBody(event);
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new HttpError(400, "Enter your email and password.");
    }
    if (email.length > 254 || password.length > 128) {
      throw new HttpError(400, "Invalid email or password.");
    }

    // Hash so raw emails never become Blobs keys.
    const id = createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);

    const locked = await rateLimit(event, { ...FAIL, id, peek: true });
    if (locked) {
      const res = jsonResponse(429, {
        error: "Too many failed attempts. Try again later or reset your password.",
      });
      res.headers["Retry-After"] = String(locked);
      return res;
    }

    const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key } = process.env;
    if (!url || !key)
      throw new HttpError(500, "Supabase environment variables are not configured.");

    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.access_token) {
      if (res.status >= 500) throw new HttpError(502, "Sign-in is unavailable. Try again shortly.");
      await rateLimit(event, { ...FAIL, id });
      // Same message for unknown email and wrong password.
      throw new HttpError(400, "Invalid email or password.");
    }

    await resetRateLimit(FAIL.name, id);
    return jsonResponse(200, {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_in: body.expires_in,
    });
  },
  { name: "login", limit: 20, windowSec: 900 },
);
