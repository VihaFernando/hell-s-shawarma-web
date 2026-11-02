// @lovable.dev/vite-tanstack-config already includes the following  do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

import { blogPaths, fetchPublishedBlog } from "./scripts/blog-data.mjs";
import { netlifyFunctionsDev } from "./scripts/vite-netlify-functions";

const isBuild = process.argv.includes("build");
// .env for local builds; Netlify's environment variables win when present.
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };

// Every published blog post/category/page is listed explicitly so it gets prerendered
// to static HTML even if no other page links to it yet. Publishing a post triggers a
// Netlify build hook, which re-runs this with fresh data.
const blogPages = isBuild ? blogPaths(await fetchPublishedBlog(env)).map((path) => ({ path })) : [];

export default defineConfig({
  // `npm run dev` serves netlify/functions at /api/* (production uses real Netlify Functions).
  plugins: [netlifyFunctionsDev()],
  // Netlify is serving this project as a static SPA via netlify.toml redirects.
  // Running Nitro's Netlify preset here triggers an extra SSR packaging step that
  // currently fails on Netlify after the client build has already succeeded.
  nitro: false,
  tanstackStart: {
    pages: blogPages,
    prerender: {
      enabled: true,
      // Every page is listed explicitly (blog pages above, static routes are auto-discovered).
      // Following links would turn a link to an unpublished post into a failed deploy.
      crawlLinks: false,
      // Emit /menu.html instead of /menu/index.html so Netlify serves the clean,
      // canonical URL with a 200 instead of 301-redirecting to a trailing slash.
      autoSubfolderIndex: false,
      // Skip in-page anchors (/#contact), the client-only admin, and trailing-slash
      // duplicates that static-route discovery produces for index routes (/blog/).
      filter: ({ path, prerender }: { path: string; prerender?: { outputPath?: string } }) =>
        prerender?.outputPath === "/_shell" ||
        (!path.includes("#") &&
          !path.startsWith("/admin") &&
          (path === "/" || !path.endsWith("/"))),
    },
    // Client-only shell (/_shell.html) for /admin and as the 404 page. The mask path must
    // not be "/" (the default), or the shell replaces the prerendered home page; it's
    // rendered from a client-only route so it contains no page content.
    spa: { enabled: true, maskPath: "/admin/login" },
    server: { entry: "server" },
  },
});
