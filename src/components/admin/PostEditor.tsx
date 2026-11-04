import { useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Loader2, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ArticleView } from "@/components/blog/ArticleView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { savePost, slugTaken, requestRebuild } from "@/lib/blog/admin-api";
import { processContent, withImageDimensions } from "@/lib/blog/content";
import { slugify } from "@/lib/blog/format";
import { can, type Member } from "@/lib/blog/permissions";
import { canonicalOverride, isHttpUrl } from "@/lib/blog/seo";
import { runSeoChecks } from "@/lib/blog/seo-checks";
import type { BlogCategory, BlogPost, FaqItem } from "@/lib/blog/types";

import { CoverImageField } from "./CoverImageField";
import { DEPLOY_STATUS_KEY } from "./DeployStatus";
import { FaqEditor } from "./FaqEditor";
import { RichTextEditor, type LinkTarget } from "./RichTextEditor";
import { SeoPanel } from "./SeoPanel";
import { displayStatus, isPublic, STATUS_STYLES } from "./status";

export type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_width: number | null;
  cover_image_height: number | null;
  category_id: string | null;
  tags: string[];
  author_name: string;
  status: BlogPost["status"];
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  faqs: FaqItem[];
};

const RESERVED_SLUGS = new Set(["page", "category", "rss", "feed", "tag"]);
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function toForm(post: BlogPost | null): PostForm {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    cover_image_url: post?.cover_image_url ?? null,
    cover_image_alt: post?.cover_image_alt ?? null,
    cover_image_width: post?.cover_image_width ?? null,
    cover_image_height: post?.cover_image_height ?? null,
    category_id: post?.category_id ?? null,
    tags: post?.tags ?? [],
    author_name: post?.author_name ?? "Hell's Shawarma",
    status: post?.status ?? "draft",
    published_at: post?.published_at ?? null,
    seo_title: post?.seo_title ?? null,
    seo_description: post?.seo_description ?? null,
    focus_keyword: post?.focus_keyword ?? null,
    og_image_url: post?.og_image_url ?? null,
    canonical_url: post?.canonical_url ?? null,
    noindex: post?.noindex ?? false,
    faqs: post?.faqs ?? [],
  };
}

// <input type="datetime-local"> works in local time without a timezone suffix.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const blank = (s: string | null) => (s?.trim() ? s.trim() : null);

export function PostEditor({
  post,
  categories,
  linkTargets,
  otherKeywords,
  member,
}: {
  post: BlogPost | null;
  categories: BlogCategory[];
  linkTargets: LinkTarget[];
  otherKeywords: { keyword: string; title: string }[];
  member: Member;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<BlogPost | null>(post);
  const [form, setForm] = useState<PostForm>(() => toForm(post));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "publish" | "unpublish">(null);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [backup, setBackup] = useState<PostForm | null>(null);
  // Bumped to remount TinyMCE when content is replaced wholesale (restore).
  const [editorKey, setEditorKey] = useState(0);
  const backupKey = `hs-blog-backup-${post?.id ?? "new"}`;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const wasEverPublic = saved ? isPublic(saved) : false;
  const savedStatus = saved ? displayStatus(saved) : "draft";

  // Mirrors the database rules; RLS rejects anything these hide anyway.
  const canPublish = can(member, "posts.publish");
  const isOwner = !saved || saved.created_by === member.user_id;
  const canEdit =
    (isOwner ? can(member, "posts.create") : can(member, "posts.edit_all")) &&
    (savedStatus === "draft" || canPublish);

  function update(patch: Partial<PostForm>) {
    setForm((f) => {
      const next = { ...f, ...patch };
      // Keep the slug following the title until it's edited by hand or the post has gone live.
      if ("title" in patch && !slugTouched && !wasEverPublic)
        next.slug = slugify(patch.title ?? "");
      return next;
    });
    setDirty(true);
  }

  // Offer to restore unsaved work from a previous session.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { form: PostForm; at: string };
      if (!post || new Date(parsed.at) > new Date(post.updated_at)) setBackup(parsed.form);
      else localStorage.removeItem(backupKey);
    } catch {
      // storage unavailable
    }
  }, [backupKey, post]);

  // Local safety net while typing.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(backupKey, JSON.stringify({ form, at: new Date().toISOString() }));
      } catch {
        // storage full/unavailable
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form, dirty, backupKey]);

  useBlocker({
    shouldBlockFn: () =>
      dirtyRef.current && !window.confirm("You have unsaved changes. Leave anyway?"),
    enableBeforeUnload: () => dirtyRef.current,
  });

  const processed = useMemo(
    () => (typeof window === "undefined" ? null : processContent(form.content)),
    [form.content],
  );
  const seo = useMemo(
    () =>
      processed
        ? runSeoChecks({
            ...form,
            content: processed,
            publishedSlugs: linkTargets.map((l) => l.value.replace(/^\/blog\//, "")),
            otherKeywords,
          })
        : { checks: [], score: 0 },
    [form, processed, linkTargets, otherKeywords],
  );

  async function persist(action: "save" | "publish" | "unpublish") {
    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title) return toast.error("Add a title first.");
    if (!SLUG_RE.test(slug))
      return toast.error("Slug can only contain lowercase letters, numbers and single hyphens.");
    if (RESERVED_SLUGS.has(slug)) return toast.error(`"${slug}" is reserved. Pick another slug.`);
    const canonical = blank(form.canonical_url);
    if (canonical && !isHttpUrl(canonical))
      return toast.error("Canonical URL must be a full URL starting with https://");
    if (action === "publish") {
      if (!form.excerpt.trim()) return toast.error("Write an excerpt before publishing.");
      if (form.cover_image_url && !form.cover_image_alt?.trim())
        return toast.error("Add alt text for the cover image.");
    }

    setBusy(action);
    try {
      if (await slugTaken(slug, saved?.id ?? null))
        throw new Error("That slug is already used by another post.");

      const c = processContent(await withImageDimensions(form.content));
      let status = form.status;
      let publishedAt = form.published_at;
      if (action === "publish") {
        status = "published";
        publishedAt = publishedAt ?? new Date().toISOString();
      } else if (action === "unpublish") {
        status = "draft";
      }

      const row = await savePost(saved?.id ?? null, {
        ...form,
        title,
        slug,
        excerpt: form.excerpt.trim(),
        content: c.html,
        toc: c.toc,
        word_count: c.wordCount,
        reading_minutes: c.readingMinutes,
        status,
        published_at: publishedAt,
        tags: form.tags.map((t) => t.trim()).filter(Boolean),
        faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
        seo_title: blank(form.seo_title),
        seo_description: blank(form.seo_description),
        focus_keyword: blank(form.focus_keyword),
        og_image_url: blank(form.og_image_url),
        canonical_url: canonicalOverride(canonical, slug),
        cover_image_alt: blank(form.cover_image_alt),
      });

      const before = saved;
      setSaved(row);
      setForm((f) => ({
        ...f,
        status: row.status,
        published_at: row.published_at,
        slug: row.slug,
        canonical_url: row.canonical_url,
      }));
      setDirty(false);
      dirtyRef.current = false;
      try {
        localStorage.removeItem(backupKey);
      } catch {
        // ignore
      }
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });

      // Static pages only change when something visible on the site changed.
      const affectsSite = (before && isPublic(before)) || isPublic(row);
      const nowStatus = displayStatus(row);
      if (affectsSite) {
        try {
          await requestRebuild(
            `${action === "unpublish" ? "unpublished" : nowStatus === "published" && !(before && isPublic(before)) ? "published" : "updated"} "${row.title}"`,
          );
          queryClient.invalidateQueries({ queryKey: DEPLOY_STATUS_KEY });
          toast.success(
            action === "unpublish"
              ? "Unpublished. The page is removed from the site in about a minute."
              : "Saved. The live page updates in about a minute.",
          );
        } catch (err) {
          toast.warning(
            `Saved, but the site rebuild didn't start: ${err instanceof Error ? err.message : err}. Use "Rebuild site" at the top.`,
          );
        }
      } else if (nowStatus === "scheduled") {
        toast.success(
          `Scheduled. It goes live automatically within an hour of ${new Date(row.published_at!).toLocaleString()}.`,
        );
      } else {
        toast.success("Draft saved.");
      }

      if (!before) navigate({ to: "/admin/posts/$id", params: { id: row.id }, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  const futureDate = form.published_at && new Date(form.published_at) > new Date();
  const publishLabel = savedStatus === "draft" ? (futureDate ? "Schedule" : "Publish") : "Update";
  const publishAction = savedStatus === "draft" ? "publish" : "save";

  const previewCategory = categories.find((c) => c.id === form.category_id);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-5 mb-6 flex flex-wrap items-center gap-3 border-b border-blog-fg/10 bg-blog-bg/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-blog-fg/60 hover:text-blog-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Posts
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[savedStatus]}`}
        >
          {saved ? savedStatus : "new"}
        </span>
        {dirty && (
          <span className="text-xs text-amber-300 light:text-amber-700">Unsaved changes</span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreview(true)}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          {canEdit && savedStatus === "draft" && (
            <Button
              variant={canPublish ? "outline" : "default"}
              size="sm"
              onClick={() => persist("save")}
              disabled={!!busy}
            >
              {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />} Save draft
            </Button>
          )}
          {canEdit && canPublish && savedStatus !== "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => persist("unpublish")}
              disabled={!!busy}
            >
              {busy === "unpublish" && <Loader2 className="h-4 w-4 animate-spin" />} Unpublish
            </Button>
          )}
          {canEdit && canPublish && (
            <Button size="sm" onClick={() => persist(publishAction)} disabled={!!busy}>
              {(busy === "publish" || (busy === "save" && savedStatus !== "draft")) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {publishLabel}
            </Button>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="mb-6 rounded-lg border border-blog-fg/15 bg-blog-fg/5 px-4 py-3 text-sm text-blog-fg/75">
          {savedStatus !== "draft" && !canPublish
            ? "This post is live. Only team members who can publish can edit it."
            : "You can view this post, but only its author or an editor can change it."}
        </div>
      )}
      {canEdit && !canPublish && (
        <div className="mb-6 rounded-lg border border-blog-fg/15 bg-blog-fg/5 px-4 py-3 text-sm text-blog-fg/75">
          Save your draft when it's ready. An editor will review and publish it.
        </div>
      )}

      {backup && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
          <Undo2 className="h-4 w-4 text-amber-300 light:text-amber-700" />
          You have unsaved changes from a previous session.
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setForm(backup);
                setDirty(true);
                setBackup(null);
                setEditorKey((k) => k + 1);
              }}
            >
              Restore
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                localStorage.removeItem(backupKey);
                setBackup(null);
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          <textarea
            value={form.title}
            onChange={(e) => update({ title: e.target.value.replace(/\n/g, " ") })}
            placeholder="Post title"
            rows={1}
            aria-label="Title"
            className="field-sizing-content w-full resize-none bg-transparent text-3xl font-extrabold leading-tight outline-none placeholder:text-blog-fg/25 md:text-4xl"
          />
          <div className="flex flex-wrap items-center gap-1 text-sm text-blog-fg/50">
            <span>hellsshawarma.lk/blog/</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
              }}
              onBlur={() => update({ slug: slugify(form.slug) })}
              aria-label="URL slug"
              className="min-w-40 flex-1 rounded border border-transparent bg-blog-fg/5 px-2 py-1 text-blog-fg outline-none focus:border-[#ff3b14]/60"
            />
          </div>
          {wasEverPublic && saved && form.slug !== saved.slug && (
            <p className="text-xs text-amber-300 light:text-amber-700">
              Changing the URL of a live post automatically adds a 301 redirect from /blog/
              {saved.slug}.
            </p>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="excerpt">Excerpt</Label>
              <span className="text-[11px] text-blog-fg/40">{form.excerpt.length}/200</span>
            </div>
            <Textarea
              id="excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              placeholder="One or two sentences shown under the title, on blog cards and (by default) in Google."
            />
          </div>
          <RichTextEditor
            key={editorKey}
            initialValue={form.content}
            onChange={(html) => update({ content: html })}
            linkTargets={linkTargets}
          />
          <p className="text-xs text-blog-fg/45">
            {processed?.wordCount ?? 0} words · {processed?.readingMinutes ?? 1} min read ·{" "}
            {processed?.toc.length ?? 0} headings
          </p>

          <section className="rounded-xl border border-blog-fg/10 bg-blog-surface p-5">
            <h2 className="font-semibold">FAQ</h2>
            <p className="mb-4 mt-1 text-xs text-blog-fg/45">
              Optional. Shown at the end of the article and marked up for search engines and AI
              answers.
            </p>
            <FaqEditor faqs={form.faqs} onChange={(faqs) => update({ faqs })} />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <Panel title="Publishing">
            <div className="space-y-1.5">
              <Label htmlFor="published-at">Publish date</Label>
              <Input
                id="published-at"
                type="datetime-local"
                value={toLocalInput(form.published_at)}
                onChange={(e) =>
                  update({
                    published_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
              <p className="text-xs text-blog-fg/45">
                Leave empty to publish now. A future date schedules the post (goes live within the
                hour).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={form.author_name}
                onChange={(e) => update({ author_name: e.target.value })}
              />
            </div>
          </Panel>

          <Panel title="Category & tags">
            <Select
              value={form.category_id ?? "none"}
              onValueChange={(v) => update({ category_id: v === "none" ? null : v })}
            >
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={form.tags.join(", ")}
                onChange={(e) =>
                  update({ tags: e.target.value.split(",").map((t) => t.trimStart()) })
                }
                placeholder="shawarma, colombo, street food"
              />
              <p className="text-xs text-blog-fg/45">Comma separated.</p>
            </div>
          </Panel>

          <Panel title="Cover image">
            <CoverImageField form={form} update={update} />
          </Panel>

          <Panel title="SEO">
            <SeoPanel form={form} update={update} checks={seo.checks} score={seo.score} />
          </Panel>
        </aside>
      </div>

      {preview && processed && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-blog-bg">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blog-fg/10 bg-black/90 px-5 py-3 backdrop-blur">
            <span className="text-sm text-blog-fg/60">Preview (not saved)</span>
            <Button size="sm" variant="outline" onClick={() => setPreview(false)}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
          <div className="font-blog">
            <ArticleView
              post={{
                slug: form.slug,
                title: form.title || "Untitled",
                excerpt: form.excerpt,
                content: processed.html,
                toc: processed.toc,
                faqs: form.faqs,
                tags: form.tags.filter(Boolean),
                reading_minutes: processed.readingMinutes,
                cover_image_url: form.cover_image_url,
                cover_image_alt: form.cover_image_alt,
                author_name: form.author_name,
                published_at: form.published_at ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
                category: previewCategory
                  ? {
                      id: previewCategory.id,
                      slug: previewCategory.slug,
                      name: previewCategory.name,
                    }
                  : null,
              }}
              crumbs={[
                { name: "Home", path: "/" },
                { name: "Blog", path: "/blog" },
                { name: form.title || "Untitled", path: `/blog/${form.slug}` },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-blog-fg/10 bg-blog-surface p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-blog-fg/60">{title}</h2>
      {children}
    </section>
  );
}
