import { Link } from "@tanstack/react-router";
import { Flame, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import logoImage from "@/assets/logo2-sm.webp";
import { ThemeToggle } from "@/components/blog/ThemeToggle";

const NAV = [
  { label: "Menu", href: "/menu" },
  { label: "Featured", href: "/#blends" },
  { label: "Gallery", href: "/gallery" },
  { label: "Locations", href: "/#contact" },
  { label: "Blog", href: "/blog" },
] as const;

const linkBase = "text-sm font-bold tracking-widest uppercase transition relative py-2";

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  if (href.includes("#")) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={`${linkBase} text-blog-fg hover:text-blog-accent`}
      >
        {label}
      </a>
    );
  }
  return (
    <Link
      to={href as "/blog"}
      onClick={onClick}
      activeOptions={{ exact: href === "/" }}
      className={`${linkBase} text-blog-fg hover:text-blog-accent data-[status=active]:text-blog-accent after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-[#ff3b14] after:scale-x-0 data-[status=active]:after:scale-x-100 after:transition-transform`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-dark py-3"
          : "bg-blog-header py-5 border-b border-transparent light:border-blog-fg/10"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10 flex items-center justify-between gap-6">
        <Link to="/" className="shrink-0" aria-label="Hell's Shawarma home">
          <img
            src={logoImage}
            alt="Hell's Shawarma"
            width={120}
            height={48}
            className="h-10 md:h-12 w-auto object-contain"
            decoding="async"
          />
        </Link>
        <nav aria-label="Main" className="hidden lg:flex items-center gap-9">
          {NAV.map((n) => (
            <NavLink key={n.label} href={n.href} label={n.label} />
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/menu"
            className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#ff3b14] px-6 py-2.5 text-sm font-bold tracking-[0.05em] uppercase text-blog-fg hover:bg-[#ff3b14] hover:text-white transition-all"
          >
            Order Now <Flame className="w-4 h-4 text-blog-accent" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden grid place-items-center w-10 h-10 rounded-full glass-dark"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          aria-label="Mobile"
          className="lg:hidden mt-3 mx-5 rounded-2xl glass-dark p-5 flex flex-col gap-1"
        >
          <NavLink href="/" label="Home" onClick={() => setOpen(false)} />
          {NAV.map((n) => (
            <NavLink key={n.label} href={n.href} label={n.label} onClick={() => setOpen(false)} />
          ))}
        </nav>
      )}
    </header>
  );
}
