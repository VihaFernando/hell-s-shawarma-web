// Netlify Function: POST /api/blog-account { action: "set-password", password }
// Completes onboarding: replaces the temporary password with the member's own
// and clears must_change_password. Done server-side so the flag can only be
// cleared together with an actual password change.

import {
  authAdmin,
  getMember,
  HttpError,
  INVITE_EXPIRES_DAYS,
  jsonResponse,
  parseBody,
  requireUser,
  serviceRest,
  withErrors,
} from "./lib/blog-admin.js";

const MIN_LENGTH = 10;

function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < MIN_LENGTH) {
    throw new HttpError(400, `Use at least ${MIN_LENGTH} characters.`);
  }
  if (pw.length > 72) throw new HttpError(400, "Use 72 characters or fewer.");
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (classes < 3) {
    throw new HttpError(400, "Mix at least three of: lowercase, uppercase, numbers, symbols.");
  }
}

export const handler = withErrors(async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  const user = await requireUser(event);
  const member = await getMember(user.id);
  if (!member || member.disabled)
    throw new HttpError(403, "This account doesn't have blog access.");

  const { action, password } = parseBody(event);
  if (action !== "set-password") throw new HttpError(400, "Unknown action.");
  if (!member.must_change_password) throw new HttpError(400, "Your password is already set.");
  if (
    member.invited_at &&
    Date.now() - new Date(member.invited_at).getTime() > INVITE_EXPIRES_DAYS * 864e5
  ) {
    throw new HttpError(403, "This invite has expired. Ask an admin to send a new one.");
  }
  validatePassword(password);

  await authAdmin(`users/${user.id}`, { method: "PUT", body: JSON.stringify({ password }) });
  await serviceRest(`blog_members?user_id=eq.${user.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
    }),
  });
  return jsonResponse(200, { ok: true });
});
