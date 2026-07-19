import { useEffect, useState } from "react";
import { Instagram } from "lucide-react";

declare global {
  interface Window {
    instgrm?: {
      Embeds: { process: () => void };
    };
  }
}

interface ReelEmbed {
  url: string;
  html: string | null;
  error: string | null;
}

type ReelsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; reels: ReelEmbed[] };

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";
let embedScriptPromise: Promise<void> | null = null;

function loadEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });

  return embedScriptPromise;
}

export function InfluencerReels() {
  const [state, setState] = useState<ReelsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/instagram-oembed")
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.reels) {
          throw new Error(body?.message ?? "Couldn't load reels right now.");
        }
        return body.reels as ReelEmbed[];
      })
      .then((reels) => {
        if (!cancelled) setState({ status: "ready", reels });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    loadEmbedScript().then(() => {
      if (!cancelled) window.instgrm?.Embeds.process();
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="flex gap-6 overflow-x-auto lg:grid lg:grid-cols-3 lg:overflow-visible">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-150 w-80 shrink-0 lg:w-full rounded-2xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl glass-dark border-white/10 py-12 px-6 text-center">
        <Instagram className="w-8 h-8 mx-auto mb-3 text-white/40" />
        <p className="text-white/60 text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
      {state.reels.map((reel) => (
        <div
          key={reel.url}
          className="w-80 shrink-0 lg:w-full rounded-2xl overflow-hidden border border-white/10 bg-white"
        >
          {reel.html ? (
            <div dangerouslySetInnerHTML={{ __html: reel.html }} />
          ) : (
            <a
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-64 text-sm text-black/50 hover:text-black"
            >
              View on Instagram
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
