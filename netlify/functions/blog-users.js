// Netlify Function: /api/blog-users (requires the users.manage permission)
//   GET                                     list team members
//   POST   { action: "invite", email, display_name, permissions }
//   POST   { action: "reset", user_id }      new temporary password + re-invite
//   PATCH  { user_id, display_name?, permissions?, disabled? }
//   DELETE ?user_id=...                     remove the member and their login
//
// Accounts are created with a random temporary password and must_change_password,
// so the first sign-in always forces the person to choose their own password.

import { randomInt } from "node:crypto";

import {
  ALL_PERMISSIONS,
  authAdmin,
  getMember,
  HttpError,
  INVITE_EXPIRES_DAYS,
  jsonResponse,
  requireMember,
  serviceRest,
  SITE_URL,
  withErrors,
} from "./lib/blog-admin.js";
import { emailConfigured, inviteText, sendInviteEmail } from "./lib/blog-email.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 16 chars, no look-alikes (0/O, 1/l/I), always mixing cases, digits and a symbol.
function tempPassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%*?"];
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < 16) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function cleanPermissions(input) {
  if (!Array.isArray(input)) throw new HttpError(400, "permissions must be a list.");
  const perms = [...new Set(input)];
  const unknown = perms.filter((p) => !ALL_PERMISSIONS.includes(p));
  if (unknown.length) throw new HttpError(400, `Unknown permission: ${unknown.join(", ")}`);
  return perms;
}

// Invite links point at whichever site the admin is using (localhost while testing).
function loginUrl(event) {
  const origin = event.headers.origin || "";
  const ok = origin === SITE_URL || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return `${ok ? origin : SITE_URL}/admin/login`;
}

async function activeManagers(excludeId) {
  const rows = await serviceRest(
    "blog_members?select=user_id&disabled=is.false&permissions=cs.{users.manage}",
  );
  return rows.filter((r) => r.user_id !== excludeId).length;
}

async function listMembers() {
  const [members, auth] = await Promise.all([
    serviceRest("blog_members?select=*&order=created_at.asc"),
    authAdmin("users?per_page=1000"),
  ]);
  const byId = new Map((auth.users ?? []).map((u) => [u.id, u]));
  return members.map((m) => ({
    ...m,
    last_sign_in_at: byId.get(m.user_id)?.last_sign_in_at ?? null,
    invite_expired:
      m.must_change_password &&
      m.invited_at &&
      Date.now() - new Date(m.invited_at).getTime() > INVITE_EXPIRES_DAYS * 864e5,
  }));
}

async function deliverInvite(event, { email, name, password, invitedBy }) {
  const details = {
    email,
    name,
    tempPassword: password,
    loginUrl: loginUrl(event),
    invitedBy,
    expiresDays: INVITE_EXPIRES_DAYS,
  };
  const result = await sendInviteEmail(details);
  return {
    emailed: result.sent,
    emailConfigured: emailConfigured(),
    tempPassword: password,
    message: inviteText(details),
  };
}

export const handler = withErrors(async (event) => {
  const { user: me, member: meMember } = await requireMember(event, ["users.manage"]);
  const myName = meMember.display_name || meMember.email;
  const body = event.body ? JSON.parse(event.body) : {};

  if (event.httpMethod === "GET") {
    return jsonResponse(200, { members: await listMembers() });
  }

  if (event.httpMethod === "POST" && body.action === "invite") {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const name = String(body.display_name ?? "")
      .trim()
      .slice(0, 80);
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email address.");
    const permissions = cleanPermissions(body.permissions ?? []);
    if (!permissions.length)
      throw new HttpError(400, "Give the new member at least one permission.");

    const password = tempPassword();
    let created;
    try {
      created = await authAdmin("users", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: name },
        }),
      });
    } catch (err) {
      if (/already|registered|exists/i.test(err.message)) {
        throw new HttpError(409, "Someone with that email already has an account.");
      }
      throw err;
    }

    try {
      await serviceRest("blog_members", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: created.id,
          email,
          display_name: name,
          permissions,
          must_change_password: true,
          invited_by: me.id,
          invited_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Don't leave an orphaned login behind if the membership row fails.
      await authAdmin(`users/${created.id}`, { method: "DELETE" }).catch(() => {});
      throw err;
    }

    const invite = await deliverInvite(event, { email, name, password, invitedBy: myName });
    return jsonResponse(200, { member: await getMember(created.id), invite });
  }

  if (event.httpMethod === "POST" && body.action === "reset") {
    const target = await getMember(body.user_id);
    if (!target) throw new HttpError(404, "Member not found.");
    if (target.user_id === me.id)
      throw new HttpError(400, "Change your own password from your account instead.");
    const password = tempPassword();
    await authAdmin(`users/${target.user_id}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
    await serviceRest(`blog_members?user_id=eq.${target.user_id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ must_change_password: true, invited_at: new Date().toISOString() }),
    });
    const invite = await deliverInvite(event, {
      email: target.email,
      name: target.display_name,
      password,
      invitedBy: myName,
    });
    return jsonResponse(200, { member: await getMember(target.user_id), invite });
  }

  if (event.httpMethod === "PATCH") {
    const target = await getMember(body.user_id);
    if (!target) throw new HttpError(404, "Member not found.");
    const patch = {};
    if (typeof body.display_name === "string")
      patch.display_name = body.display_name.trim().slice(0, 80);
    if (body.permissions !== undefined) patch.permissions = cleanPermissions(body.permissions);
    if (typeof body.disabled === "boolean") patch.disabled = body.disabled;

    const self = target.user_id === me.id;
    if (self && patch.disabled) throw new HttpError(400, "You can't disable your own account.");
    if (self && patch.permissions && !patch.permissions.includes("users.manage")) {
      throw new HttpError(400, "You can't remove your own user-management permission.");
    }
    const losesManager =
      target.permissions.includes("users.manage") &&
      (patch.disabled === true ||
        (patch.permissions && !patch.permissions.includes("users.manage")));
    if (losesManager && (await activeManagers(target.user_id)) === 0) {
      throw new HttpError(400, "At least one active member must be able to manage users.");
    }

    if (typeof patch.disabled === "boolean" && patch.disabled !== target.disabled) {
      // A ban also blocks sign-in and token refresh, not just blog access.
      await authAdmin(`users/${target.user_id}`, {
        method: "PUT",
        body: JSON.stringify({ ban_duration: patch.disabled ? "876000h" : "none" }),
      });
    }
    await serviceRest(`blog_members?user_id=eq.${target.user_id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return jsonResponse(200, { member: await getMember(target.user_id) });
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.user_id;
    const target = id ? await getMember(id) : null;
    if (!target) throw new HttpError(404, "Member not found.");
    if (target.user_id === me.id) throw new HttpError(400, "You can't remove yourself.");
    if (
      target.permissions.includes("users.manage") &&
      (await activeManagers(target.user_id)) === 0
    ) {
      throw new HttpError(400, "At least one active member must be able to manage users.");
    }
    // Deleting the login cascades to blog_members; their posts stay (created_by -> null).
    await authAdmin(`users/${target.user_id}`, { method: "DELETE" });
    return jsonResponse(200, { ok: true });
  }

  return jsonResponse(405, { error: "Method not allowed" });
});
