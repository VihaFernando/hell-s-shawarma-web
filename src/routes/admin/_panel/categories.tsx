import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DEPLOY_STATUS_KEY } from "@/components/admin/DeployStatus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCategory,
  listAdminCategories,
  requestRebuild,
  saveCategory,
} from "@/lib/blog/admin-api";
import { slugify } from "@/lib/blog/format";
import { can } from "@/lib/blog/permissions";
import type { BlogCategory } from "@/lib/blog/types";

export const Route = createFileRoute("/admin/_panel/categories")({
  beforeLoad: ({ context }) => {
    if (!can(context.member, "categories.manage")) throw redirect({ to: "/admin" });
  },
  component: CategoriesPage,
});

const KEY = ["admin-categories"];

type Draft = Pick<
  BlogCategory,
  "name" | "slug" | "description" | "seo_title" | "seo_description" | "sort_order"
> & {
  id: string | null;
};

const empty = (order: number): Draft => ({
  id: null,
  name: "",
  slug: "",
  description: "",
  seo_title: "",
  seo_description: "",
  sort_order: order,
});

function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({ queryKey: KEY, queryFn: listAdminCategories });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingRebuild, setPendingRebuild] = useState(false);

  async function save() {
    if (!draft) return;
    const slug = slugify(draft.slug || draft.name);
    if (!draft.name.trim() || !slug) return toast.error("Name is required.");
    setSaving(true);
    try {
      await saveCategory(draft.id, {
        name: draft.name.trim(),
        slug,
        description: draft.description.trim(),
        seo_title: draft.seo_title?.trim() || null,
        seo_description: draft.seo_description?.trim() || null,
        sort_order: Number(draft.sort_order) || 0,
      });
      toast.success("Category saved.");
      setDraft(null);
      setPendingRebuild(true);
      queryClient.invalidateQueries({ queryKey: KEY });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: BlogCategory) {
    if (!window.confirm(`Delete "${c.name}"? Its posts stay published but lose their category.`))
      return;
    try {
      await deleteCategory(c.id);
      setPendingRebuild(true);
      queryClient.invalidateQueries({ queryKey: KEY });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function rebuild() {
    try {
      await requestRebuild("category changes");
      setPendingRebuild(false);
      queryClient.invalidateQueries({ queryKey: DEPLOY_STATUS_KEY });
      toast.success("Rebuild started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rebuild failed");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-blog-fg/55">
            Each category gets its own indexable page at /blog/category/…
          </p>
        </div>
        <Button onClick={() => setDraft(empty((categories?.length ?? 0) + 1))}>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {pendingRebuild && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
          Category changes go live on the next site rebuild.
          <Button size="sm" onClick={rebuild}>
            Rebuild now
          </Button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-blog-fg/10">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-blog-fg/50" />
          </div>
        ) : (
          <ul className="divide-y divide-blog-fg/10">
            {categories?.map((c) => (
              <li key={c.id} className="flex items-center gap-4 bg-blog-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-blog-fg/45">
                    /blog/category/{c.slug} · {c.description || "No description"}
                  </p>
                </div>
                <Button size="icon" variant="ghost" title="Edit" onClick={() => setDraft({ ...c })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(c)}>
                  <Trash2 className="h-4 w-4 text-red-400 light:text-red-700" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-lg border-blog-fg/10 bg-blog-surface text-blog-fg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_90px] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        name: e.target.value,
                        slug: draft.id ? draft.slug : slugify(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-order">Order</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
                {draft.id && (
                  <p className="text-xs text-amber-300 light:text-amber-700">
                    Changing a live category's slug changes its URL.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Description (shown on the category page)</Label>
                <Textarea
                  id="cat-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-seo-title">SEO title</Label>
                <Input
                  id="cat-seo-title"
                  value={draft.seo_title ?? ""}
                  onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })}
                  placeholder={`${draft.name || "Category"} | Hell's Shawarma Blog`}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-seo-desc">Meta description</Label>
                <Textarea
                  id="cat-seo-desc"
                  rows={2}
                  value={draft.seo_description ?? ""}
                  onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
