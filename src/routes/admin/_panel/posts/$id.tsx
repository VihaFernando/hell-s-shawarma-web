import { createFileRoute } from "@tanstack/react-router";

import { PostEditor } from "@/components/admin/PostEditor";

export const Route = createFileRoute("/admin/_panel/posts/$id")({
  loader: async ({ params }) => {
    // Dynamic import keeps supabase-js out of the public (blog/site) bundle.
    const { getAdminPost, listAdminCategories, listAdminPosts } = await import(
      "@/lib/blog/admin-api"
    );
    const [post, categories, posts] = await Promise.all([
      params.id === "new" ? null : getAdminPost(params.id),
      listAdminCategories(),
      listAdminPosts(),
    ]);
    // Published posts appear in the editor's link picker for easy internal linking.
    const linkTargets = posts
      .filter(
        (p) =>
          p.status === "published" &&
          !!p.published_at &&
          new Date(p.published_at) <= new Date() &&
          p.id !== params.id,
      )
      .map((p) => ({ title: `Blog: ${p.title}`, value: `/blog/${p.slug}` }));
    const otherKeywords = posts.flatMap((p) =>
      p.id !== params.id && p.focus_keyword?.trim()
        ? [{ keyword: p.focus_keyword, title: p.title }]
        : [],
    );
    return { post, categories, linkTargets, otherKeywords };
  },
  // Always fetch fresh data when opening the editor.
  staleTime: 0,
  gcTime: 0,
  component: EditPostPage,
});

function EditPostPage() {
  const { post, categories, linkTargets, otherKeywords } = Route.useLoaderData();
  const { member } = Route.useRouteContext();
  const { id } = Route.useParams();
  return (
    <PostEditor
      key={id}
      post={post}
      categories={categories}
      linkTargets={linkTargets}
      otherKeywords={otherKeywords}
      member={member}
    />
  );
}
