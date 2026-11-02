// Transactional email for team invites via Resend (https://resend.com, free tier:
// 3,000 emails/month). Optional: without RESEND_API_KEY the admin UI shows the
// invite text to copy and send manually instead.
//
// Env: RESEND_API_KEY, BLOG_EMAIL_FROM (e.g. "Hell's Shawarma <team@hellsshawarma.lk>",
//      the domain must be verified in Resend).

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.BLOG_EMAIL_FROM);
}

export function inviteText({ name, email, tempPassword, loginUrl, invitedBy, expiresDays }) {
  return [
    `Hi${name ? ` ${name}` : ""},`,
    "",
    `${invitedBy} has invited you to the Hell's Shawarma blog admin.`,
    "",
    `Sign in here: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    "",
    `You'll be asked to choose your own password when you first sign in. This temporary password expires in ${expiresDays} days.`,
  ].join("\n");
}

function inviteHtml({ name, email, tempPassword, loginUrl, invitedBy, expiresDays }) {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141414;border:1px solid #2a2a2a;border-radius:14px;padding:32px">
<tr><td>
<p style="margin:0 0 4px;color:#ff3b14;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Hell's Shawarma</p>
<h1 style="margin:0 0 20px;font-size:22px;color:#fff">You're invited to the blog admin</h1>
<p style="margin:0 0 16px;line-height:1.6;color:#cfcfcf">Hi${name ? ` ${esc(name)}` : ""}, ${esc(invitedBy)} has given you access to write for the Hell's Shawarma blog.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;background:#0d0d0d;border-radius:10px;border:1px solid #2a2a2a">
<tr><td style="padding:14px 16px;font-size:14px;color:#9a9a9a">Email<br><span style="color:#fff;font-size:15px">${esc(email)}</span></td></tr>
<tr><td style="padding:0 16px 14px;font-size:14px;color:#9a9a9a">Temporary password<br><span style="color:#fff;font-size:17px;font-family:Consolas,Menlo,monospace;letter-spacing:1px">${esc(tempPassword)}</span></td></tr>
</table>
<a href="${esc(loginUrl)}" style="display:inline-block;background:#ff3b14;color:#fff;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 26px;border-radius:6px">Sign in</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a8a8a">You'll choose your own password the first time you sign in. The temporary password expires in ${expiresDays} days. If you weren't expecting this, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendInviteEmail(details) {
  if (!emailConfigured()) return { sent: false, reason: "not_configured" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.BLOG_EMAIL_FROM,
      to: [details.email],
      subject: "You're invited to the Hell's Shawarma blog admin",
      html: inviteHtml(details),
      text: inviteText(details),
    }),
  });
  if (!res.ok) {
    console.error("Resend failed", res.status, await res.text());
    return { sent: false, reason: "send_failed" };
  }
  return { sent: true };
}
