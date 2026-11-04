import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-blog-fg/55">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5 min-w-0">
              {last ? (
                <span aria-current="page" className="text-blog-accent truncate max-w-[60vw]">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link to={item.path as "/blog"} className="hover:text-blog-fg transition-colors">
                    {item.name}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-blog-fg/30" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
