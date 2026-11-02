import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transformImage } from "@/lib/blog/images";
import { uploadImage } from "@/lib/blog/media";

import type { PostForm } from "./PostEditor";

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
            src={transformImage(form.cover_image_url, { width: 640, height: 320, crop: "fill" })}
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
