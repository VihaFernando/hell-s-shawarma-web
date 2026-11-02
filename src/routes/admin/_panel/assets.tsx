import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAsset, listAssets, type BlogAsset } from "@/lib/blog/admin-api";
import { formatDate } from "@/lib/blog/format";
import { transformImage } from "@/lib/blog/images";
import { can } from "@/lib/blog/permissions";

const ASSETS_KEY = ["admin-assets"];

type AssetPages = InfiniteData<Awaited<ReturnType<typeof listAssets>>, string | null>;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const assetName = (asset: BlogAsset) => asset.publicId.split("/").at(-1);

export const Route = createFileRoute("/admin/_panel/assets")({
  component: AssetsPage,
});

function AssetsPage() {
  const { member } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState<BlogAsset | null>(null);
  const [toDelete, setToDelete] = useState<BlogAsset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const canDelete = can(member, "posts.delete");

  // Each page costs Cloudinary Admin API quota, so it only runs when asked for.
  const { data, error, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ASSETS_KEY,
      queryFn: ({ pageParam }) => listAssets(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    });
  const assets = data?.pages.flatMap((p) => p.assets) ?? [];

  async function confirmDelete() {
    if (!toDelete) return;
    const { publicId } = toDelete;
    setDeleting(true);
    try {
      await deleteAsset(publicId);
      queryClient.setQueryData<AssetPages>(
        ASSETS_KEY,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              assets: p.assets.filter((a) => a.publicId !== publicId),
            })),
          },
      );
      setViewing(null);
      toast.success("Image deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      // A refusal means this page's usage info is out of date.
      setViewing(null);
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold">Asset library</h1>
      <p className="mt-1 text-sm text-blog-fg/55">
        Images uploaded for the blog. Add new images from the post editor.
      </p>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-blog-fg/50">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-red-400 light:text-red-700">{(error as Error).message}</p>
      ) : assets.length === 0 ? (
        <p className="py-16 text-center text-sm text-blog-fg/55">No images yet.</p>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <li
                key={asset.publicId}
                className="overflow-hidden rounded-xl border border-blog-fg/10 bg-blog-surface"
              >
                <button
                  type="button"
                  onClick={() => setViewing(asset)}
                  aria-label={`View ${assetName(asset)}`}
                  className="block w-full"
                >
                  <img
                    src={transformImage(asset.url, { width: 320, format: "webp" })}
                    alt=""
                    width={320}
                    height={240}
                    loading="lazy"
                    decoding="async"
                    className="aspect-4/3 w-full bg-blog-fg/5 object-contain"
                  />
                </button>
                <div className="p-3">
                  <UsageBadge asset={asset} />
                  <p className="mt-2 text-xs text-blog-fg/45">
                    {formatDate(asset.createdAt)} · {formatSize(asset.bytes)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {hasNextPage && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />} Load more
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{viewing && assetName(viewing)}</DialogTitle>
            <DialogDescription>
              {viewing &&
                `${viewing.width}×${viewing.height} · ${formatSize(viewing.bytes)} · ${viewing.format.toUpperCase()} · Uploaded ${formatDate(viewing.createdAt)}`}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <>
              <img
                src={transformImage(viewing.url, { width: 1200 })}
                alt=""
                width={viewing.width}
                height={viewing.height}
                className="max-h-[60vh] w-full rounded-lg bg-blog-fg/5 object-contain"
              />
              {viewing.usedBy.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold">Used in</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {viewing.usedBy.map((post) => (
                      <li key={post.id}>
                        <Link
                          to="/admin/posts/$id"
                          params={{ id: post.id }}
                          className="text-blog-link underline underline-offset-4"
                        >
                          {post.title || "Untitled"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : viewing.isNew ? (
                <p className="text-sm text-blog-fg/60">
                  Uploaded in the last 24 hours. It can be deleted after that, in case it's being
                  used in a post that hasn't been saved yet.
                </p>
              ) : canDelete ? (
                <div>
                  <Button variant="destructive" onClick={() => setToDelete(viewing)}>
                    <Trash2 className="h-4 w-4" /> Delete image
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-blog-fg/60">This image isn't used in any post.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it from Cloudinary and can't be undone. Every post is checked
              again first, and the image is kept if anything is using it.
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

function UsageBadge({ asset }: { asset: BlogAsset }) {
  const count = asset.usedBy.length;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        count
          ? "bg-emerald-400/15 text-emerald-300 light:text-emerald-700"
          : "bg-blog-fg/10 text-blog-fg/70"
      }`}
    >
      {count ? `Used in ${count} ${count === 1 ? "post" : "posts"}` : "Not used"}
    </span>
  );
}
