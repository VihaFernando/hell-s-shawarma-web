// Netlify Function: POST /api/blog-rebuild
// Called by the blog admin after publishing/updating/unpublishing a post.
// Verifies the caller is a blog admin, then fires the Netlify build hook so
// the post is prerendered into static HTML (and sitemap/RSS are refreshed).

import { jsonResponse, requireMember, triggerBuild, withErrors } from "./lib/blog-admin.js";

// Each call fires a Netlify build (build minutes), so keep it low.
export const handler = withErrors(
  async (event) => {
    if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
    const { user } = await requireMember(event, [
      "posts.publish",
      "posts.delete",
      "categories.manage",
      "site.rebuild",
    ]);

    let reason = "content update";
    try {
      reason = String(JSON.parse(event.body || "{}").reason || reason).slice(0, 100);
    } catch {
      // keep default
    }

    const triggeredAt = await triggerBuild(`${reason} (${user.email})`);
    return jsonResponse(200, { ok: true, triggeredAt });
  },
  { name: "rebuild", limit: 5, windowSec: 60 },
);
