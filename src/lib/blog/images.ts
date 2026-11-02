// Image URL helpers. Cloudinary URLs get on-the-fly transforms (format, quality,
// width); any other URL (e.g. a future R2 bucket) is returned untouched.

const UPLOAD_SEGMENT = "/image/upload/";
// A leading transformation component such as "f_auto,q_auto,w_800/".
const TRANSFORM_RE = /^([a-z]{1,3}_[^/]+)\//;

export function isCloudinary(url: string | null | undefined): url is string {
  return !!url && url.includes("res.cloudinary.com") && url.includes(UPLOAD_SEGMENT);
}

// Strips any transformation we previously added, so transforms never stack.
export function cloudinaryBase(url: string) {
  if (!isCloudinary(url)) return url;
  const [head, tail] = url.split(UPLOAD_SEGMENT);
  return head + UPLOAD_SEGMENT + tail.replace(TRANSFORM_RE, "");
}

export function transformImage(
  url: string,
  opts: { width?: number; height?: number; crop?: "fill" | "limit"; format?: "auto" | "jpg" } = {},
) {
  if (!isCloudinary(url)) return url;
  const { width, height, crop = "limit", format = "auto" } = opts;
  const parts = [`f_${format}`, "q_auto"];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);
  if (crop === "fill") parts.push("g_auto");
  const [head, tail] = cloudinaryBase(url).split(UPLOAD_SEGMENT);
  return `${head}${UPLOAD_SEGMENT}${parts.join(",")}/${tail}`;
}

export function responsiveImage(
  url: string,
  widths: number[],
  opts: { aspect?: number } = {},
): { src: string; srcSet?: string } {
  if (!isCloudinary(url)) return { src: url };
  const make = (w: number) =>
    transformImage(url, {
      width: w,
      height: opts.aspect ? Math.round(w / opts.aspect) : undefined,
      crop: opts.aspect ? "fill" : "limit",
    });
  return {
    src: make(widths[Math.floor(widths.length / 2)]),
    srcSet: widths.map((w) => `${make(w)} ${w}w`).join(", "),
  };
}

// Open Graph images: 1200x630 JPEG (Facebook/WhatsApp don't read AVIF/WebP reliably).
export function ogImage(url: string) {
  return transformImage(url, { width: 1200, height: 630, crop: "fill", format: "jpg" });
}
