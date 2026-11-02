export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  updated_at: string;
};

export type TocItem = { id: string; text: string; level: 2 | 3 };
export type FaqItem = { question: string; answer: string };

export type PostStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  toc: TocItem[];
  faqs: FaqItem[];
  word_count: number;
  reading_minutes: number;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_width: number | null;
  cover_image_height: number | null;
  category_id: string | null;
  tags: string[];
  author_name: string;
  status: PostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRef = Pick<BlogCategory, "id" | "slug" | "name">;

export type PostWithCategory = BlogPost & { category: CategoryRef | null };

export type PostCard = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "cover_image_url"
  | "cover_image_alt"
  | "cover_image_width"
  | "cover_image_height"
  | "published_at"
  | "updated_at"
  | "reading_minutes"
> & { category: CategoryRef | null };

export const BLOG_PAGE_SIZE = 9;
