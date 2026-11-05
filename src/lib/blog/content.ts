// Turns editor HTML into the final, SEO-ready article HTML at save time (admin
// browser only). Public pages render the stored result as-is, so prerendering
// needs no DOM library. Safe to run repeatedly on its own output.

import { SITE_URL } from "@/lib/seo";

import { slugify } from "./format";
import { cloudinaryBase, isCloudinary, transformImage } from "./images";
import { sanitizeHtml } from "./sanitize";
import type { TocItem } from "./types";

const EMBED_HOSTS = [
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.google.com", // Google Maps embeds
  "www.instagram.com",
  "www.tiktok.com",
];
const CONTENT_IMAGE_WIDTHS = [480, 800, 1200, 1600];
const WORDS_PER_MINUTE = 220;
const IMAGE_PROBE_TIMEOUT_MS = 8000;

export type ProcessedContent = {
  html: string;
  toc: TocItem[];
  wordCount: number;
  readingMinutes: number;
  images: { src: string; alt: string }[];
  internalLinks: number;
  /** Slugs of other blog posts this article links to. */
  linkedPostSlugs: string[];
  externalLinks: number;
  firstParagraph: string;
  headings: { level: number; text: string }[];
  text: string;
};

const sanitize = sanitizeHtml;

function isInternal(href: string) {
  if (href.startsWith("/") || href.startsWith("#")) return true;
  try {
    return new URL(href).host.replace(/^www\./, "") === new URL(SITE_URL).host;
  } catch {
    return false;
  }
}

function imageSize(src: string) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const probe = new Image();
    const timer = setTimeout(() => resolve(null), IMAGE_PROBE_TIMEOUT_MS);
    probe.onload = () => {
      clearTimeout(timer);
      const { naturalWidth: width, naturalHeight: height } = probe;
      resolve(width && height ? { width, height } : null);
    };
    probe.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    probe.src = src;
  });
}

const pixels = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// Dimensions reserve each image's space before it loads, which prevents layout shift.
// An image that can't be measured keeps its current markup, so it never blocks a save.
export async function withImageDimensions(rawHtml: string) {
  const doc = new DOMParser().parseFromString(
    `<div id="root">${sanitize(rawHtml)}</div>`,
    "text/html",
  );
  const root = doc.getElementById("root")!;
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(async (img) => {
      const width = pixels(img.getAttribute("width"));
      const height = pixels(img.getAttribute("height"));
      if (width && height) return;
      const size = await imageSize(img.getAttribute("src") ?? "");
      if (!size) return;
      const ratio = size.height / size.width;
      img.setAttribute(
        "width",
        String(width ?? (height ? Math.round(height / ratio) : size.width)),
      );
      img.setAttribute(
        "height",
        String(height ?? (width ? Math.round(width * ratio) : size.height)),
      );
    }),
  );
  return root.innerHTML;
}

export function processContent(rawHtml: string): ProcessedContent {
  const doc = new DOMParser().parseFromString(
    `<div id="root">${sanitize(rawHtml)}</div>`,
    "text/html",
  );
  const root = doc.getElementById("root")!;

  // Only the page title is an <h1>; demote any in the body.
  root.querySelectorAll("h1").forEach((h1) => {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h1.innerHTML;
    h1.replaceWith(h2);
  });

  // Drop empty paragraphs/headings the editor leaves behind.
  root.querySelectorAll("p, h2, h3, h4").forEach((el) => {
    // trim() also strips &nbsp;, which TinyMCE uses for "empty" paragraphs.
    if (!el.textContent?.trim() && !el.querySelector("img, iframe")) el.remove();
  });

  // Stable heading anchors + table of contents.
  const toc: TocItem[] = [];
  const used = new Set<string>();
  root.querySelectorAll("h2, h3").forEach((h) => {
    const text = h.textContent?.trim() ?? "";
    let id = slugify(text) || "section";
    let n = 2;
    while (used.has(id)) id = `${slugify(text)}-${n++}`;
    used.add(id);
    h.id = id;
    toc.push({ id, text, level: h.tagName === "H2" ? 2 : 3 });
  });

  // Images: responsive Cloudinary srcset, lazy loading, explicit alt.
  const images: ProcessedContent["images"] = [];
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    img.setAttribute("alt", img.getAttribute("alt")?.trim() ?? "");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    if (isCloudinary(src)) {
      const base = cloudinaryBase(src);
      img.setAttribute("src", transformImage(base, { width: 1200 }));
      img.setAttribute(
        "srcset",
        CONTENT_IMAGE_WIDTHS.map((w) => `${transformImage(base, { width: w })} ${w}w`).join(", "),
      );
      img.setAttribute("sizes", "(min-width: 1024px) 768px, 100vw");
    }
    images.push({ src: img.getAttribute("src") ?? "", alt: img.getAttribute("alt") ?? "" });
  });

  // Links: external ones open in a new tab safely.
  let internalLinks = 0;
  let externalLinks = 0;
  const linkedPostSlugs = new Set<string>();
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href")!;
    if (/^(mailto|tel):/i.test(href)) return;
    if (isInternal(href)) {
      if (!href.startsWith("#")) internalLinks++;
      // Absolute links to our own domain become root-relative (works on previews too).
      try {
        const u = new URL(href, SITE_URL);
        if (!href.startsWith("/") && !href.startsWith("#"))
          a.setAttribute("href", u.pathname + u.search + u.hash);
        const post = u.pathname.match(/^\/blog\/([a-z0-9-]+)\/?$/)?.[1];
        if (post && !["page", "category", "rss.xml"].includes(post)) linkedPostSlugs.add(post);
      } catch {
        // leave as-is
      }
      a.removeAttribute("target");
      a.removeAttribute("rel");
    } else {
      externalLinks++;
      a.setAttribute("target", "_blank");
      const rel = new Set((a.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      a.setAttribute("rel", [...rel].join(" "));
    }
  });

  // Embeds: allow-listed hosts only, responsive wrapper, lazy.
  root.querySelectorAll("iframe").forEach((frame) => {
    let host = "";
    try {
      host = new URL(frame.getAttribute("src") ?? "").host;
    } catch {
      // invalid src
    }
    if (!EMBED_HOSTS.includes(host)) {
      frame.remove();
      return;
    }
    frame.setAttribute("loading", "lazy");
    frame.removeAttribute("width");
    frame.removeAttribute("height");
    if (!frame.getAttribute("title")) frame.setAttribute("title", "Embedded content");
    const parent = frame.parentElement;
    if (!parent?.classList.contains("embed")) {
      const wrap = doc.createElement("div");
      wrap.className = "embed";
      frame.replaceWith(wrap);
      wrap.appendChild(frame);
    }
  });

  // Wide tables scroll horizontally on phones.
  root.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-wrap")) return;
    const wrap = doc.createElement("div");
    wrap.className = "table-wrap";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });

  const text = (root.textContent ?? "").replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;
  const firstP = Array.from(root.querySelectorAll("p")).find((p) => p.textContent?.trim());

  return {
    html: root.innerHTML,
    toc,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    images,
    internalLinks,
    linkedPostSlugs: [...linkedPostSlugs],
    externalLinks,
    firstParagraph: firstP?.textContent?.trim() ?? "",
    headings: Array.from(root.querySelectorAll("h2, h3, h4")).map((h) => ({
      level: Number(h.tagName[1]),
      text: h.textContent?.trim() ?? "",
    })),
    text,
  };
}
