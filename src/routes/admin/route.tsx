import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { useApplyBlogTheme, useBlogTheme } from "@/lib/blog/theme";

// Everything under /admin is client-only (served from the SPA shell, never
// prerendered) and hidden from search engines.
export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Blog Admin | Hell's Shawarma" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  useApplyBlogTheme();
  const { theme } = useBlogTheme();
  return (
    <div className="min-h-screen bg-blog-bg text-blog-fg font-blog">
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton theme={theme} />
    </div>
  );
}
