// On-page SEO checklist shown in the editor (a lightweight Yoast/RankMath).

import type { ProcessedContent } from "./content";
import { postSeoDescription, postSeoTitle } from "./seo";

export type CheckLevel = "good" | "ok" | "bad";
export type SeoCheck = { id: string; level: CheckLevel; label: string };

export type SeoInput = {
  title: string;
  slug: string;
  excerpt: string;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_width: number | null;
  category_id: string | null;
  content: ProcessedContent;
  /** Slugs of posts that are live now; links to anything else 404 for visitors. */
  publishedSlugs?: string[];
  /** Other posts' focus keywords, drafts included, so two posts don't target one search. */
  otherKeywords?: { keyword: string; title: string }[];
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  return norm(haystack).split(norm(needle)).length - 1;
}

export function runSeoChecks(input: SeoInput): { checks: SeoCheck[]; score: number } {
  const checks: SeoCheck[] = [];
  const add = (id: string, level: CheckLevel, label: string) => checks.push({ id, level, label });

  const title = postSeoTitle(input);
  const description = postSeoDescription(input);
  const kw = input.focus_keyword?.trim() ?? "";
  const c = input.content;

  // Title
  if (title.length < 30)
    add("title-length", "ok", `SEO title is short (${title.length} chars). Aim for 50-60.`);
  else if (title.length > 60)
    add("title-length", "bad", `SEO title is ${title.length} chars; Google cuts it off around 60.`);
  else add("title-length", "good", `SEO title length is good (${title.length} chars).`);

  // Meta description
  if (!description) add("desc", "bad", "Add an excerpt or meta description.");
  else if (description.length < 110)
    add("desc", "ok", `Meta description is short (${description.length} chars). Aim for 120-160.`);
  else if (description.length > 160)
    add("desc", "bad", `Meta description is ${description.length} chars; keep it under 160.`);
  else add("desc", "good", `Meta description length is good (${description.length} chars).`);

  // Focus keyword
  if (!kw) {
    add("kw", "bad", "Set a focus keyword (the main search phrase this article should rank for).");
  } else {
    if (norm(kw).split(" ").length > 5)
      add("kw-length", "ok", "Focus keyword is long. Use a short search phrase of 2-4 words.");
    const duplicate = input.otherKeywords?.find((o) => norm(o.keyword) === norm(kw));
    if (duplicate) {
      add(
        "kw-unique",
        "bad",
        `"${duplicate.title}" already targets this focus keyword. Choose a different one so the posts don't compete.`,
      );
    }
    const inTitle = countOccurrences(title, kw) > 0;
    add(
      "kw-title",
      inTitle ? "good" : "bad",
      inTitle
        ? "Focus keyword appears in the SEO title."
        : "Put the focus keyword in the SEO title, ideally near the start.",
    );
    const inDesc = countOccurrences(description, kw) > 0;
    add(
      "kw-desc",
      inDesc ? "good" : "ok",
      inDesc
        ? "Focus keyword appears in the meta description."
        : "Mention the focus keyword in the meta description.",
    );
    const slugKw = norm(kw).replace(/\s+/g, "-");
    const inSlug =
      input.slug.includes(slugKw) ||
      norm(kw)
        .split(" ")
        .every((w) => input.slug.includes(w));
    add(
      "kw-slug",
      inSlug ? "good" : "ok",
      inSlug ? "Focus keyword is in the URL." : "Include the focus keyword in the URL slug.",
    );
    const inIntro = countOccurrences(c.firstParagraph, kw) > 0;
    add(
      "kw-intro",
      inIntro ? "good" : "ok",
      inIntro
        ? "Focus keyword appears in the first paragraph."
        : "Use the focus keyword in the first paragraph.",
    );
    const inHeading = c.headings.some((h) => countOccurrences(h.text, kw) > 0);
    add(
      "kw-heading",
      inHeading ? "good" : "ok",
      inHeading
        ? "Focus keyword appears in a subheading."
        : "Use the focus keyword in at least one H2/H3.",
    );
    const density = c.wordCount
      ? (countOccurrences(c.text, kw) * norm(kw).split(" ").length * 100) / c.wordCount
      : 0;
    if (density === 0)
      add("kw-density", "bad", "The focus keyword doesn't appear in the article body.");
    else if (density > 3)
      add(
        "kw-density",
        "bad",
        `Keyword density is ${density.toFixed(1)}%; that reads as stuffing. Aim for 0.5-2.5%.`,
      );
    else if (density < 0.4)
      add(
        "kw-density",
        "ok",
        `Keyword density is ${density.toFixed(1)}%. Use it a little more naturally.`,
      );
    else add("kw-density", "good", `Keyword density is ${density.toFixed(1)}%.`);
  }

  // Content depth & structure
  if (c.wordCount < 300)
    add("length", "bad", `Article is ${c.wordCount} words. Aim for 600+ for a chance to rank.`);
  else if (c.wordCount < 600)
    add("length", "ok", `Article is ${c.wordCount} words. 600-1,500 words tends to rank better.`);
  else add("length", "good", `Article length is good (${c.wordCount} words).`);

  const h2s = c.headings.filter((h) => h.level === 2).length;
  add(
    "headings",
    h2s >= 2 ? "good" : "ok",
    h2s >= 2
      ? `Uses ${h2s} H2 subheadings.`
      : "Break the article up with at least two H2 subheadings.",
  );

  // Images
  if (!input.cover_image_url)
    add("cover", "bad", "Add a cover image (used in Google, social shares and the blog grid).");
  else if (!input.cover_image_alt?.trim()) add("cover", "bad", "Add alt text to the cover image.");
  else add("cover", "good", "Cover image has alt text.");
  if (input.cover_image_url && input.cover_image_width && input.cover_image_width < 1200) {
    add(
      "cover-size",
      "ok",
      `Cover image is ${input.cover_image_width}px wide. Use at least 1200px so it stays sharp in Google and social shares.`,
    );
  }
  const missingAlt = c.images.filter((i) => !i.alt).length;
  if (missingAlt) add("alt", "bad", `${missingAlt} image(s) in the article are missing alt text.`);
  else if (c.images.length) add("alt", "good", "All article images have alt text.");

  // Links
  add(
    "internal",
    c.internalLinks > 0 ? "good" : "ok",
    c.internalLinks > 0
      ? `${c.internalLinks} internal link(s) (menu, other posts...).`
      : "Link to the menu, a branch or another post at least once.",
  );
  if (input.publishedSlugs) {
    const live = new Set(input.publishedSlugs);
    const broken = c.linkedPostSlugs.filter((s) => s !== input.slug && !live.has(s));
    if (broken.length) {
      add(
        "broken-links",
        "bad",
        `Links to post(s) that aren't published yet (visitors get a 404): ${broken.map((s) => `/blog/${s}`).join(", ")}. Publish those first or remove the links.`,
      );
    }
  }
  if (c.externalLinks > 0)
    add("external", "good", `${c.externalLinks} outbound link(s) to sources.`);

  // Housekeeping
  add(
    "excerpt",
    input.excerpt.trim() ? "good" : "bad",
    input.excerpt.trim()
      ? "Excerpt is set."
      : "Write a short excerpt (shown on cards and as the intro).",
  );
  add(
    "category",
    input.category_id ? "good" : "ok",
    input.category_id
      ? "Category is set."
      : "Pick a category so the post appears on a category page.",
  );
  if (input.slug.length > 75)
    add("slug", "ok", "The URL slug is long; shorter URLs are easier to share.");

  const points = checks.reduce(
    (sum, ch) => sum + (ch.level === "good" ? 2 : ch.level === "ok" ? 1 : 0),
    0,
  );
  return { checks, score: Math.round((points / (checks.length * 2)) * 100) };
}
