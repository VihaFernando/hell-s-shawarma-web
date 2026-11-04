import type { BlogPost } from "@/lib/blog/types";

export type DisplayStatus = "draft" | "scheduled" | "published";

export function displayStatus(post: Pick<BlogPost, "status" | "published_at">): DisplayStatus {
  if (post.status !== "published") return "draft";
  return post.published_at && new Date(post.published_at) > new Date() ? "scheduled" : "published";
}

/** Live on the site right now (so changing it needs a rebuild). */
export const isPublic = (post: Pick<BlogPost, "status" | "published_at">) =>
  displayStatus(post) === "published";

export const STATUS_STYLES: Record<DisplayStatus, string> = {
  draft: "bg-blog-fg/10 text-blog-fg/70",
  scheduled: "bg-amber-400/15 text-amber-300 light:bg-amber-500/15 light:text-amber-800",
  published: "bg-emerald-400/15 text-emerald-300 light:bg-emerald-500/15 light:text-emerald-800",
};
