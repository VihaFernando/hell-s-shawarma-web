import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ARTICLE_COVER_ASPECT,
  CARD_COVER_ASPECT,
  GOOGLE_IMAGE_SIZES,
  googleImage,
  ogImage,
  responsiveImage,
} from "@/lib/blog/images";
import { uploadImage } from "@/lib/blog/media";

import type { PostForm } from "./PostEditor";

// Uses the URLs public pages request, so each preview is the crop visitors actually get.
function cropPreviews(cover: string, shareImage: string) {
  return [
    {
      label: "Blog card",
      src: responsiveImage(cover, [640], { aspect: CARD_COVER_ASPECT }).src,
      aspect: CARD_COVER_ASPECT,
    },
    { label: "Facebook & WhatsApp", src: ogImage(shareImage), aspect: 1200 / 630 },
    ...GOOGLE_IMAGE_SIZES.map((size) => ({
      label: `Google ${size.label}`,
      src: googleImage(cover, size),
      aspect: size.width / size.height,
    })),
  ];
}

export function CoverImageField({
  form,
  update,
}: {
  form: PostForm;
  update: (patch: Partial<PostForm>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const img = await uploadImage(file);
      update({
        cover_image_url: img.url,
        cover_image_width: img.width,
        cover_image_height: img.height,
      });
      if (img.width < 1200)
        toast.warning(
          "For best results in Google and social shares, use an image at least 1200px wide.",
        );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {form.cover_image_url ? (
        <div className="group relative overflow-hidden rounded-lg border border-blog-fg/10">
          <img
            src={responsiveImage(form.cover_image_url, [640], { aspect: ARTICLE_COVER_ASPECT }).src}
            alt={form.cover_image_alt ?? ""}
            className="aspect-2/1 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                update({ cover_image_url: null, cover_image_width: null, cover_image_height: null })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`grid aspect-2/1 w-full place-items-center rounded-lg border border-dashed text-sm text-blog-fg/55 transition ${
            dragging
              ? "border-[#ff3b14] bg-[#ff3b14]/10"
              : "border-blog-fg/20 hover:border-blog-fg/40"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex flex-col items-center gap-2">
              <ImagePlus className="h-6 w-6" />
              Drop an image or click to upload
              <span className="text-xs text-blog-fg/35">1600×900 or larger recommended</span>
            </span>
          )}
        </button>
      )}
      {form.cover_image_url && (
        <div>
          <p className="text-xs text-blog-fg/45">
            Article page crop shown above. Covers are cropped automatically, so check nothing
            important is cut off. Photos inside the article are never cropped.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
            {cropPreviews(form.cover_image_url, form.og_image_url || form.cover_image_url).map(
              (crop) => (
                <li key={crop.label}>
                  <img
                    src={crop.src}
                    alt=""
                    loading="lazy"
                    style={{ aspectRatio: crop.aspect }}
                    className="w-full rounded-md bg-blog-fg/5 object-cover ring-1 ring-blog-fg/10"
                  />
                  <p className="mt-1 text-[11px] text-blog-fg/55">{crop.label}</p>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="space-y-1.5">
        <Label htmlFor="cover-alt">
          Alt text <span className="text-red-400 light:text-red-700">*</span>
        </Label>
        <Input
          id="cover-alt"
          value={form.cover_image_alt ?? ""}
          onChange={(e) => update({ cover_image_alt: e.target.value })}
          placeholder="Describe the photo, e.g. Chicken shawarma wrap sliced in half"
        />
      </div>
    </div>
  );
}
