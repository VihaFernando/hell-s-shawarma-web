import { createFileRoute, notFound } from "@tanstack/react-router";

import { ArticleView } from "@/components/blog/ArticleView";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogNotFound, blogFontPreload } from "@/components/blog/listing-route";
import { fetchPost, fetchRelatedPosts } from "@/lib/blog/api";
import { postHead, ROBOTS_NOINDEX } from "@/lib/blog/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug);
    if (!post) throw notFound();
    const related = await fetchRelatedPosts(post);
    return { post, related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Article not found | Hell's Shawarma" },
          { name: "robots", content: ROBOTS_NOINDEX },
        ],
      };
    }
    const { meta, links } = postHead(loaderData.post);
    return { meta, links: [...links, blogFontPreload] };
  },
  component: PostPage,
  notFoundComponent: BlogNotFound,
});

function PostPage() {
  const { post, related } = Route.useLoaderData();
  const { crumbs } = postHead(post);
  return (
    <BlogLayout>
      {/* Rendered here because head() dedupes by property, which would keep only one tag. */}
      {post.tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      <ArticleView post={post} related={related} crumbs={crumbs} />
    </BlogLayout>
  );
}
