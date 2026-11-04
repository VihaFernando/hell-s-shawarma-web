// Image uploads for the blog admin. Everything goes through uploadImage() so the
// storage provider can be swapped (Cloudinary today, Cloudflare R2 later)
// without touching the editor.

import { getUploadSignature } from "./admin-api";

export type UploadedImage = { url: string; width: number; height: number };

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 2400;

/**
 * Downscales big photos and re-encodes them as WebP in the browser before upload.
 * Saves storage/bandwidth quota (essential on free tiers) and makes the original
 * light enough to serve directly if a provider can't transform on the fly.
 */
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}

async function uploadToCloudinary(file: File): Promise<UploadedImage> {
  const { uploadUrl, fields } = await getUploadSignature();
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  form.append("file", file);

  const res = await fetch(uploadUrl, { method: "POST", body: form });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? `Upload failed (${res.status}).`);
  return { url: body.secure_url, width: body.width, height: body.height };
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 15 MB.");
  return uploadToCloudinary(await prepareImage(file));
}
