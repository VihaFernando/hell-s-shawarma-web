// Netlify Function: GET /api/blog-deploy-status
// Lets the blog admin show whether the latest site build is still running,
// live, or failed. Uses the Netlify API with a personal access token.
//
// Env: NETLIFY_API_TOKEN (falls back to BLOBS_TOKEN), NETLIFY_SITE_ID (falls
// back to BLOBS_SITE_ID). Both already exist for the Instagram Blobs store.

import { getMeta, jsonResponse, requireMember, withErrors } from "./lib/blog-admin.js";

export const handler = withErrors(async (event) => {
  await requireMember(event);

  const token = process.env.NETLIFY_API_TOKEN || process.env.BLOBS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.BLOBS_SITE_ID;
  const lastTrigger = await getMeta("last_build_trigger");

  if (!token || !siteId) {
    return jsonResponse(200, { available: false, lastTrigger });
  }

  const res = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys?per_page=1&production=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) return jsonResponse(200, { available: false, lastTrigger });

  const [deploy] = await res.json();
  return jsonResponse(200, {
    available: true,
    lastTrigger,
    deploy: deploy
      ? {
          state: deploy.state, // "new" | "enqueued" | "building" | "uploading" | "processing" | "ready" | "error"
          title: deploy.title,
          createdAt: deploy.created_at,
          publishedAt: deploy.published_at,
          errorMessage: deploy.error_message,
          deployTime: deploy.deploy_time,
        }
      : null,
  });
});
