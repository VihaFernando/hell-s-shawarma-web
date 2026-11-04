export declare const BLOG_PAGE_SIZE: number;

export type BuildPost = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  published_at: string;
  updated_at: string;
  noindex: boolean;
  canonical_url: string | null;
  category: { slug: string; name: string } | null;
};

export type BuildBlogData = {
  posts: BuildPost[];
  categories: { slug: string; name: string; updated_at: string }[];
  redirects: { from: string; to: string }[];
};

export declare function supabaseEnv(
  env?: Record<string, string | undefined>,
): { url: string; key: string } | null;
export declare function fetchPublishedBlog(
  env?: Record<string, string | undefined>,
): Promise<BuildBlogData | null>;
export declare function blogPaths(data: BuildBlogData | null): string[];
