import { Editor } from "@tinymce/tinymce-react";
import { useMemo, useRef } from "react";
import type { Editor as TinyEditor } from "tinymce";

import outfitFont from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";
import proseCss from "@/styles/blog-prose.css?raw";
import { transformImage } from "@/lib/blog/images";
import { uploadImage } from "@/lib/blog/media";
import { useBlogTheme } from "@/lib/blog/theme";

export type LinkTarget = { title: string; value: string };

// The editor iframe doesn't inherit the page's CSS variables, so the light
// article colours are passed in explicitly (mirrors html[data-blog-theme="light"]).
const LIGHT_CONTENT = `
  :root {
    --blog-prose-text: rgba(26, 20, 16, 0.82);
    --blog-prose-heading: #1a1410;
    --blog-prose-muted: rgba(26, 20, 16, 0.55);
    --blog-prose-accent: #d12d0c;
    --blog-prose-link: #c2410c;
    --blog-prose-border: rgba(26, 20, 16, 0.12);
    --blog-prose-surface: #f3efe9;
  }
  html { background: #ffffff; }
  body[data-mce-placeholder]:not(.mce-visualblocks)::before { color: rgba(26, 20, 16, .35); }
`;
const DARK_CONTENT = `
  html { background: #0a0a0a; }
  body[data-mce-placeholder]:not(.mce-visualblocks)::before { color: rgba(255, 255, 255, .35); }
`;

const SITE_LINKS: LinkTarget[] = [
  { title: "Menu", value: "/menu" },
  { title: "Locations (home page)", value: "/#contact" },
  { title: "Gallery", value: "/gallery" },
  { title: "Blog home", value: "/blog" },
];

// Self-hosted TinyMCE from /public/tinymce (GPL build; no API key, no cloud calls).
export function RichTextEditor({
  initialValue,
  onChange,
  linkTargets,
}: {
  initialValue: string;
  onChange: (html: string) => void;
  linkTargets: LinkTarget[];
}) {
  const linksRef = useRef(linkTargets);
  linksRef.current = linkTargets;
  // Switching theme remounts the editor (skins can't change live); it restarts from
  // the latest content, not the content the page loaded with.
  const latest = useRef(initialValue);
  const { theme } = useBlogTheme();
  // Must not change while typing: the wrapper reloads the document whenever this
  // prop changes, which throws the cursor and page back to the top.
  const startValue = useMemo(() => latest.current, [theme]);

  const init = useMemo(
    () => ({
      height: 720,
      min_height: 520,
      autoresize_bottom_margin: 40,
      menubar: "edit view insert format table tools",
      skin: theme === "light" ? "oxide" : "oxide-dark",
      content_css: false as const,
      body_class: "blog-prose",
      content_style: `
        @font-face { font-family: "Outfit Variable"; src: url(${outfitFont}) format("woff2"); font-weight: 100 900; font-display: swap; }
        ${proseCss}
        ${theme === "light" ? LIGHT_CONTENT : DARK_CONTENT}
        body { margin: 24px auto; max-width: 760px; padding: 0 20px; }
        .callout:empty::before { content: "Tip…"; opacity: .4; }
      `,
      plugins: [
        "advlist",
        "autolink",
        "lists",
        "link",
        "image",
        "charmap",
        "anchor",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "media",
        "table",
        "wordcount",
        "autoresize",
        "quickbars",
        "accordion",
        "help",
        "preview",
      ],
      toolbar:
        "undo redo | blocks | bold italic underline | link image media | bullist numlist blockquote | " +
        "hscallout hscta accordion table | alignleft aligncenter | removeformat | searchreplace code fullscreen help",
      toolbar_mode: "sliding" as const,
      // Stays pinned below PostEditor's sticky top bar while scrolling long posts.
      toolbar_sticky: true,
      toolbar_sticky_offset: 57,
      // Only the article title is an H1 (rendered by the page), so the body starts at H2.
      block_formats: "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4",
      invalid_elements: "script,style,h1,font",
      quickbars_selection_toolbar: "bold italic | quicklink h2 h3 blockquote",
      quickbars_insert_toolbar: "quickimage quicktable hr",
      placeholder: "Start writing… Use Heading 2 for main sections and Heading 3 for sub-sections.",
      browser_spellcheck: true,
      contextmenu: false as const,
      promotion: false,
      branding: false,
      elementpath: false,
      resize: true,

      // Links: keep URLs exactly as typed; external-link rel/target is added on save.
      convert_urls: false,
      link_assume_external_targets: "https" as const,
      link_title: false,
      target_list: false as const,
      rel_list: false as const,
      link_list: (done: (items: LinkTarget[]) => void) =>
        done([...SITE_LINKS, ...linksRef.current]),

      // Images: upload straight to storage; alt text field is always shown.
      image_caption: true,
      image_title: false,
      image_advtab: false,
      image_dimensions: true,
      image_description: true,
      automatic_uploads: true,
      paste_data_images: true,
      file_picker_types: "image",
      images_file_types: "jpg,jpeg,png,webp,gif,avif,heic,heif",
      images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
        const blob = blobInfo.blob();
        const { url } = await uploadImage(
          new File([blob], blobInfo.filename(), { type: blob.type }),
        );
        // Auto format so the editor can show HEIC; the article page rebuilds this URL.
        return transformImage(url);
      },
      media_alt_source: false,
      media_poster: false,
      media_dimensions: false,

      table_default_attributes: {},
      table_default_styles: {},
      table_sizing_mode: "relative" as const,

      setup: (editor: TinyEditor) => {
        editor.ui.registry.addButton("hscallout", {
          text: "Callout",
          tooltip: "Highlighted tip or note",
          onAction: () => {
            const selected = editor.selection.getContent();
            editor.insertContent(`<div class="callout"><p>${selected || "Tip: "}</p></div><p></p>`);
          },
        });
        editor.ui.registry.addButton("hscta", {
          text: "CTA button",
          tooltip: "Insert a call-to-action button",
          onAction: () => {
            editor.windowManager.open({
              title: "Call-to-action button",
              body: {
                type: "panel",
                items: [
                  { type: "input", name: "text", label: "Button text" },
                  {
                    type: "selectbox",
                    name: "preset",
                    label: "Link to",
                    items: [
                      { text: "Menu", value: "/menu" },
                      { text: "Find a branch", value: "/#contact" },
                      {
                        text: "Order on Uber Eats",
                        value:
                          "https://www.ubereats.com/lk/store/hells-shawarma-%26-grill/ZM3tJn6fRe-RtiSWcW0rdA",
                      },
                      { text: "Custom URL…", value: "custom" },
                    ],
                  },
                  { type: "input", name: "url", label: "Custom URL (if chosen above)" },
                ],
              },
              initialData: { text: "View the menu", preset: "/menu", url: "" },
              buttons: [
                { type: "cancel", text: "Cancel" },
                { type: "submit", text: "Insert", buttonType: "primary" },
              ],
              onSubmit: (api) => {
                const data = api.getData() as { text: string; preset: string; url: string };
                const href = data.preset === "custom" ? data.url.trim() : data.preset;
                if (!href || !data.text.trim()) return;
                const esc = editor.dom.encode;
                editor.insertContent(
                  `<p class="cta-row"><a class="cta-button" href="${esc(href)}">${esc(data.text.trim())}</a></p><p></p>`,
                );
                api.close();
              },
            });
          },
        });
      },
    }),
    [theme],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-blog-fg/10">
      <Editor
        key={theme}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        initialValue={startValue}
        // TinyMCE normalises the HTML on load and reports it as a change; record that
        // baseline so opening a post doesn't flag "Unsaved changes".
        onInit={(_evt, editor) => {
          latest.current = editor.getContent();
        }}
        onEditorChange={(html) => {
          if (html === latest.current) return;
          latest.current = html;
          onChange(html);
        }}
        init={init}
      />
    </div>
  );
}
