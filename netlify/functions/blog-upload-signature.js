// Netlify Function: POST /api/blog-upload-signature
// Returns a short-lived signed Cloudinary upload payload so the admin's
// browser can upload images straight to Cloudinary without ever seeing the
// API secret. Only blog admins can get a signature.
//
// Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import { createHash } from "node:crypto";

import { jsonResponse, requireMember, withErrors } from "./lib/blog-admin.js";

const FOLDER = "hells-shawarma/blog";

export const handler = withErrors(async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  await requireMember(event, ["posts.create"]);

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return jsonResponse(500, { error: "Cloudinary environment variables are not configured." });
  }

  const params = {
    // heic/heif: iPhone photos the browser couldn't convert to WebP before upload.
    allowed_formats: "jpg,jpeg,png,webp,avif,gif,heic,heif",
    folder: FOLDER,
    timestamp: Math.floor(Date.now() / 1000),
  };
  // Cloudinary signature: sorted key=value pairs joined by "&", then the secret, SHA-1.
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1")
    .update(toSign + CLOUDINARY_API_SECRET)
    .digest("hex");

  return jsonResponse(200, {
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    fields: { ...params, api_key: CLOUDINARY_API_KEY, signature },
  });
});
