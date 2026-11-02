// Netlify Function: /api/blog-assets
// GET  ?cursor=   one page of blog images, newest first, with the posts using each one.
// POST {public_id}  permanently deletes one image, re-checking every safety rule first.
//
// Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import {
  getMeta,
  HttpError,
  jsonResponse,
  requireMember,
  serviceRest,
  withErrors,
} from "./lib/blog-admin.js";

const FOLDER = "hells-shawarma/blog";
const PAGE_SIZE = 24;
const POSTS_BATCH = 500;
// Unsaved editor work only exists in the browser, so a new upload may be in use without a post showing it.
const NEW_UPLOAD_GRACE_MS = 24 * 3600e3;
// Live pages keep showing a removed image until the rebuild started by that save has finished.
const REBUILD_GRACE_MS = 10 * 60e3;

function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new HttpError(500, "Cloudinary environment variables are not configured.");
  }
  return {
    base: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`,
    auth: Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64"),
  };
}

async function cloudinary(path, init = {}) {
  const { base, auth } = cloudinaryConfig();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => null);
  if (res.status === 404) throw new HttpError(404, "That image no longer exists.");
  if (res.status === 420 || res.status === 429) {
    throw new HttpError(429, "Cloudinary's hourly API limit was reached. Try again later.");
  }
  if (!res.ok) throw new HttpError(502, body?.error?.message ?? `Cloudinary ${res.status}`);
  return body;
}

// Every post, drafts included. Any failure stops the request, so nothing is ever judged unused.
async function allPosts() {
  const posts = [];
  for (let offset = 0; ; offset += POSTS_BATCH) {
    const batch = await serviceRest(
      `blog_posts?select=id,title,cover_image_url,og_image_url,content&order=id&offset=${offset}&limit=${POSTS_BATCH}`,
    );
    if (!Array.isArray(batch)) throw new HttpError(502, "Couldn't read blog posts.");
    posts.push(...batch);
    if (batch.length < POSTS_BATCH) return posts;
  }
}

// A plain substring match: a false "in use" only hides Delete, which is the safe direction.
function postsUsing(publicId, posts) {
  return posts
    .filter((p) =>
      [p.cover_image_url, p.og_image_url, p.content].some((field) => field?.includes(publicId)),
    )
    .map((p) => ({ id: p.id, title: p.title }));
}

const isNewUpload = (createdAt) => Date.now() - new Date(createdAt).getTime() < NEW_UPLOAD_GRACE_MS;

async function list(event) {
  await requireMember(event);
  const cursor = event.queryStringParameters?.cursor;

  // The Search API is used because folder listings ignore sort order.
  const [page, posts] = await Promise.all([
    cloudinary("/resources/search", {
      method: "POST",
      body: JSON.stringify({
        expression: `folder="${FOLDER}" AND resource_type:image`,
        sort_by: [{ created_at: "desc" }],
        max_results: PAGE_SIZE,
        ...(cursor ? { next_cursor: cursor } : {}),
      }),
    }),
    allPosts(),
  ]);

  return jsonResponse(200, {
    nextCursor: page.next_cursor ?? null,
    assets: page.resources.map((r) => {
      const usedBy = postsUsing(r.public_id, posts);
      return {
        publicId: r.public_id,
        url: r.secure_url,
        width: r.width,
        height: r.height,
        bytes: r.bytes,
        format: r.format,
        createdAt: r.created_at,
        usedBy,
        isNew: isNewUpload(r.created_at),
      };
    }),
  });
}

async function remove(event) {
  const { user } = await requireMember(event, ["posts.delete"]);

  let publicId;
  try {
    publicId = JSON.parse(event.body || "{}").public_id;
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
  if (
    typeof publicId !== "string" ||
    !publicId.startsWith(`${FOLDER}/`) ||
    publicId.includes("..")
  ) {
    throw new HttpError(400, "Only blog images can be deleted.");
  }

  const encodedId = publicId.split("/").map(encodeURIComponent).join("/");
  const asset = await cloudinary(`/resources/image/upload/${encodedId}`);
  if (isNewUpload(asset.created_at)) {
    throw new HttpError(
      409,
      "This image is less than 24 hours old, so it may be in an unsaved post.",
    );
  }

  const lastBuild = await getMeta("last_build_trigger");
  if (lastBuild?.at && Date.now() - new Date(lastBuild.at).getTime() < REBUILD_GRACE_MS) {
    throw new HttpError(409, "The site was just rebuilt. Wait 10 minutes, then try again.");
  }

  const usedBy = postsUsing(publicId, await allPosts());
  if (usedBy.length) {
    throw new HttpError(409, `This image is used in "${usedBy[0].title}", so it can't be deleted.`);
  }

  const params = new URLSearchParams({ invalidate: "true" });
  params.append("public_ids[]", publicId);
  const result = await cloudinary(`/resources/image/upload?${params}`, { method: "DELETE" });
  if (result.deleted?.[publicId] !== "deleted") {
    throw new HttpError(502, "Cloudinary didn't delete the image. Try again.");
  }

  console.log(`blog-assets: ${user.email} deleted ${publicId}`);
  return jsonResponse(200, { ok: true });
}

export const handler = withErrors(async (event) => {
  if (event.httpMethod === "GET") return list(event);
  if (event.httpMethod === "POST") return remove(event);
  return jsonResponse(405, { error: "Method not allowed" });
});
