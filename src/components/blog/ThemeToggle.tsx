import { Moon, Sun } from "lucide-react";

import { useBlogTheme } from "@/lib/blog/theme";

// Both icons are rendered and CSS picks one, so prerendered HTML never
// mismatches the theme the boot script chose.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggle } = useBlogTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch between light and dark mode"
      className={`grid h-10 w-10 place-items-center rounded-full border border-blog-fg/15 text-blog-fg/80 transition hover:border-blog-accent hover:text-blog-accent ${className}`}
    >
      <Sun className="h-[18px] w-[18px] light:hidden" aria-hidden="true" />
      <Moon className="hidden h-[18px] w-[18px] light:block" aria-hidden="true" />
    </button>
  );
}
