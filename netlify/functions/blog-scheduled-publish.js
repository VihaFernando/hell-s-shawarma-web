// Scheduled Netlify Function (hourly, see netlify.toml).
// Scheduled posts are rows with status = 'published' and a future published_at;
// RLS hides them until that time passes. This checks whether any post has
// become visible since the last build trigger and, if so, rebuilds the site so
// it gets prerendered, added to the sitemap and pinged to search engines.

import { getMeta, serviceRest, triggerBuild } from "./lib/blog-admin.js";

export const handler = async () => {
  try {
    const now = new Date().toISOString();
    const last =
      (await getMeta("last_build_trigger"))?.at ?? new Date(Date.now() - 2 * 3600e3).toISOString();

    const due = await serviceRest(
      `blog_posts?select=slug&status=eq.published&published_at=gt.${last}&published_at=lte.${now}&limit=20`,
    );
    if (!due?.length) {
      return { statusCode: 200, body: "No scheduled posts due." };
    }

    await triggerBuild(`scheduled publish: ${due.map((p) => p.slug).join(", ")}`);
    console.log(
      "blog-scheduled-publish: rebuild triggered for",
      due.map((p) => p.slug),
    );
    return { statusCode: 200, body: `Rebuild triggered for ${due.length} post(s).` };
  } catch (err) {
    console.error("blog-scheduled-publish failed", err);
    return { statusCode: 500, body: "Failed" };
  }
};
