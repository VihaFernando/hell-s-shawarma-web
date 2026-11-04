import { Check, Facebook, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.02c0-5.19 4.23-9.42 9.43-9.42a9.37 9.37 0 0 1 9.42 9.43c0 5.2-4.23 9.43-9.43 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.8.7.71 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.3l5.72-1.5a11.3 11.3 0 0 0 5.72 1.46h.01c6.26 0 11.35-5.1 11.35-11.35 0-3.03-1.18-5.88-3.33-8.03z" />
    </svg>
  );
}

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  async function onClick() {
    // Native share sheet on phones; fallback menu on desktop.
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      window.matchMedia("(pointer: coarse)").matches
    ) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // dismissed: fall through to menu
      }
    }
    setOpen((v) => !v);
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const enc = encodeURIComponent;
  const item =
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-blog-fg/85 hover:bg-blog-fg/10";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 text-sm text-blog-fg/75 hover:text-blog-fg transition-colors"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" /> Share
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-52 rounded-lg border border-blog-fg/10 bg-blog-elevated p-1.5 shadow-2xl"
        >
          <a
            role="menuitem"
            className={item}
            href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a
            role="menuitem"
            className={item}
            href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-4 w-4" /> Facebook
          </a>
          <a
            role="menuitem"
            className={item}
            href={`https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="w-4 text-center font-bold">𝕏</span> X (Twitter)
          </a>
          <button role="menuitem" type="button" className={item} onClick={copy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-400 light:text-green-700" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
