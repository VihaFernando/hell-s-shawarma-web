import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useApplyBlogTheme } from "@/lib/blog/theme";

export function BlogLayout({ children }: { children: ReactNode }) {
  useApplyBlogTheme();
  return (
    <div className="min-h-screen bg-blog-bg text-blog-fg overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-[#ff3b14] focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>
      <SiteHeader />
      {/* Header/footer keep the site's Lato; long-form content uses the more readable Outfit. */}
      <main id="main" className="font-blog">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
