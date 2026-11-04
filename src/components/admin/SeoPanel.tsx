import { AlertCircle, CheckCircle2, CircleDot } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ogImage } from "@/lib/blog/images";
import type { SeoCheck } from "@/lib/blog/seo-checks";
import { postSeoDescription, postSeoTitle } from "@/lib/blog/seo";

import type { PostForm } from "./PostEditor";

function Counter({ value, min, max }: { value: number; min: number; max: number }) {
  const color =
    value === 0
      ? "text-blog-fg/40"
      : value > max
        ? "text-red-400 light:text-red-700"
        : value < min
          ? "text-amber-300 light:text-amber-700"
          : "text-emerald-400 light:text-emerald-700";
  return (
    <span className={`text-[11px] tabular-nums ${color}`}>
      {value}/{max}
    </span>
  );
}

export function SeoPanel({
  form,
  update,
  checks,
  score,
}: {
  form: PostForm;
  update: (patch: Partial<PostForm>) => void;
  checks: SeoCheck[];
  score: number;
}) {
  const title = postSeoTitle(form);
  const description = postSeoDescription(form);
  const shareImage = form.og_image_url || form.cover_image_url;
  const scoreColor =
    score >= 80
      ? "text-emerald-400 light:text-emerald-700"
      : score >= 55
        ? "text-amber-300 light:text-amber-700"
        : "text-red-400 light:text-red-700";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="focus-kw">Focus keyword</Label>
        <Input
          id="focus-kw"
          value={form.focus_keyword ?? ""}
          onChange={(e) => update({ focus_keyword: e.target.value })}
          placeholder="e.g. best shawarma in Colombo"
        />
        <p className="text-xs text-blog-fg/45">
          The main phrase people would search to find this article. Keep it to 2-4 words, and use a
          different one for each post. Put related phrases in tags.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-title">SEO title</Label>
          <Counter value={title.length} min={40} max={60} />
        </div>
        <Input
          id="seo-title"
          value={form.seo_title ?? ""}
          onChange={(e) => update({ seo_title: e.target.value })}
          placeholder={`${form.title || "Post title"} | Hell's Shawarma`}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seo-desc">Meta description</Label>
          <Counter value={description.length} min={120} max={160} />
        </div>
        <Textarea
          id="seo-desc"
          rows={3}
          value={form.seo_description ?? ""}
          onChange={(e) => update({ seo_description: e.target.value })}
          placeholder="Defaults to the excerpt. Write a compelling 1-2 sentence summary with the focus keyword."
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blog-fg/45">
          Google preview
        </p>
        <div className="rounded-lg bg-white p-4 font-sans">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt=""
              className="h-7 w-7 rounded-full border border-gray-200 bg-white p-0.5"
            />
            <div className="leading-tight">
              <p className="text-sm text-[#202124]">Hell's Shawarma</p>
              <p className="text-xs text-[#4d5156]">
                https://hellsshawarma.lk › blog › {form.slug || "…"}
              </p>
            </div>
          </div>
          <p className="mt-2 line-clamp-1 text-xl leading-snug text-[#1a0dab]">{title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">
            {description || "Add an excerpt or meta description…"}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blog-fg/45">
          Social share preview
        </p>
        <div className="overflow-hidden rounded-lg border border-blog-fg/10 bg-blog-elevated">
          {shareImage ? (
            <img
              src={ogImage(shareImage)}
              alt=""
              className="aspect-[1200/630] w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[1200/630] place-items-center text-xs text-blog-fg/40">
              No image (site default is used)
            </div>
          )}
          <div className="p-3">
            <p className="text-[11px] uppercase text-blog-fg/45">hellsshawarma.lk</p>
            <p className="line-clamp-1 font-semibold">
              {form.seo_title || form.title || "Post title"}
            </p>
            <p className="line-clamp-1 text-sm text-blog-fg/55">{description}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="og-image">Custom social image URL (optional)</Label>
          <Input
            id="og-image"
            value={form.og_image_url ?? ""}
            onChange={(e) => update({ og_image_url: e.target.value })}
            placeholder="Defaults to the cover image"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-blog-fg/45">
            SEO checklist
          </p>
          <span className={`text-sm font-bold ${scoreColor}`}>{score}/100</span>
        </div>
        <ul className="mt-3 space-y-2">
          {[...checks]
            .sort(
              (a, b) =>
                ["bad", "ok", "good"].indexOf(a.level) - ["bad", "ok", "good"].indexOf(b.level),
            )
            .map((c) => (
              <li key={c.id} className="flex gap-2 text-sm leading-snug">
                {c.level === "good" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400 light:text-emerald-700" />
                ) : c.level === "ok" ? (
                  <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-amber-300 light:text-amber-700" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400 light:text-red-700" />
                )}
                <span className="text-blog-fg/75">{c.label}</span>
              </li>
            ))}
        </ul>
      </div>

      <details className="rounded-lg border border-blog-fg/10 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Advanced</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="canonical">Canonical URL override</Label>
            <Input
              id="canonical"
              value={form.canonical_url ?? ""}
              onChange={(e) => update({ canonical_url: e.target.value })}
              placeholder="Only if this article was first published elsewhere"
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="noindex">Hide from search engines</Label>
              <p className="text-xs text-blog-fg/45">
                Adds noindex and removes it from the sitemap.
              </p>
            </div>
            <Switch
              id="noindex"
              checked={form.noindex}
              onCheckedChange={(v) => update({ noindex: v })}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
