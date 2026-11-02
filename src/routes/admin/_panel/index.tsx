import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ImageOff, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DEPLOY_STATUS_KEY } from "@/components/admin/DeployStatus";
import {
  displayStatus,
  isPublic,
  STATUS_STYLES,
  type DisplayStatus,
} from "@/components/admin/status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deletePost,
  listAdminPosts,
  listTeamNames,
  requestRebuild,
  type AdminPostRow,
} from "@/lib/blog/admin-api";
import { can } from "@/lib/blog/permissions";
import { formatDate } from "@/lib/blog/format";
import { transformImage } from "@/lib/blog/images";

export const ADMIN_POSTS_KEY = ["admin-posts"];

export const Route = createFileRoute("/admin/_panel/")({
  component: PostsPage,
});

const FILTERS: { id: "all" | DisplayStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "scheduled", label: "Scheduled" },
  { id: "draft", label: "Drafts" },
];

function PostsPage() {
  const { member } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: team } = useQuery({ queryKey: ["admin-team-names"], queryFn: listTeamNames });
  const authorName = (id: string | null) => {
    const m = team?.find((t) => t.user_id === id);
    return m ? m.display_name || m.email : null;
  };
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({ queryKey: ADMIN_POSTS_KEY, queryFn: listAdminPosts });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<AdminPostRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: posts?.length ?? 0,
      published: 0,
      scheduled: 0,
      draft: 0,
    };
    posts?.forEach((p) => c[displayStatus(p)]++);
    return c;
  }, [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts ?? []).filter(
      (p) =>
        (filter === "all" || displayStatus(p) === filter) &&
        (!q || p.title.toLowerCase().includes(q) || p.slug.includes(q)),
    );
  }, [posts, filter, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deletePost(toDelete.id);
      if (isPublic(toDelete) && can(member, "posts.delete")) {
        await requestRebuild(`deleted "${toDelete.title}"`).catch((e) => toast.error(e.message));
        queryClient.invalidateQueries({ queryKey: DEPLOY_STATUS_KEY });
      }
      toast.success("Post deleted.");
      queryClient.invalidateQueries({ queryKey: ADMIN_POSTS_KEY });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="mt-1 text-sm text-blog-fg/55">Write, schedule and publish blog articles.</p>
        </div>
        {can(member, "posts.create") && (
          <Button asChild>
            <Link to="/admin/posts/$id" params={{ id: "new" }}>
              <Plus className="h-4 w-4" /> New post
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-blog-fg/5 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                filter === f.id ? "bg-[#ff3b14] text-white" : "text-blog-fg/65 hover:text-white"
              }`}
            >
              {f.label} <span className="opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blog-fg/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="pl-8"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-blog-fg/10">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-blog-fg/50">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-400 light:text-red-700">{(error as Error).message}</p>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-blog-fg/55">
            {posts?.length ? "No posts match." : "No posts yet. Write your first one!"}
          </div>
        ) : (
          <ul className="divide-y divide-blog-fg/10">
            {visible.map((p) => {
              const status = displayStatus(p);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-4 bg-blog-surface px-4 py-3 hover:bg-blog-elevated"
                >
                  <div className="hidden h-12 w-20 shrink-0 overflow-hidden rounded-md bg-blog-fg/5 sm:block">
                    {p.cover_image_url ? (
                      <img
                        src={transformImage(p.cover_image_url, {
                          width: 160,
                          height: 96,
                          crop: "fill",
                        })}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-blog-fg/25">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/admin/posts/$id"
                      params={{ id: p.id }}
                      className="block truncate font-semibold hover:text-blog-link"
                    >
                      {p.title || "Untitled"}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-blog-fg/45">
                      /blog/{p.slug} · {p.category?.name ?? "No category"}
                      {authorName(p.created_by) && ` · by ${authorName(p.created_by)}`}
                      {p.noindex && " · noindex"}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-blog-fg/50 md:block">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[status]}`}
                    >
                      {status}
                    </span>
                    <p className="mt-1">
                      {status === "draft"
                        ? `Edited ${formatDate(p.updated_at)}`
                        : formatDate(p.published_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {status === "published" && (
                      <Button asChild size="icon" variant="ghost" title="View on site">
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noopener">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button asChild size="icon" variant="ghost" title="Edit">
                      <Link to="/admin/posts/$id" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    {can(member, "posts.delete") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete"
                        onClick={() => setToDelete(p)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400 light:text-red-700" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the post. If it's live, the page will disappear from the site
              after the next rebuild (started automatically). Consider unpublishing instead if you
              might want it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
