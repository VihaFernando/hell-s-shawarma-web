import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Star } from "lucide-react";

import logoImage from "@/assets/logo2-sm.webp";
import { BRANCHES, BUSINESS } from "@/lib/site-info";

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82c-.9-.79-1.47-1.94-1.47-3.22h-3.13v13.44a2.6 2.6 0 1 1-2.6-2.6c.24 0 .47.03.69.09V10.4a5.73 5.73 0 0 0-.69-.04A5.73 5.73 0 1 0 15.13 16V9.4a8.15 8.15 0 0 0 4.71 1.5V7.77a4.85 4.85 0 0 1-3.24-1.95z" />
    </svg>
  );
}

const EXPLORE = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Featured", href: "/#blends" },
  { label: "Gallery", href: "/gallery" },
  { label: "Locations", href: "/#contact" },
  { label: "Blog", href: "/blog" },
] as const;

const BRANCH_HOURS: Record<string, string> = {
  dehiwala: "Daily 2:30 PM-1 AM",
  kollupitiya: "Fri-Sun 5 PM-1 AM, Tue-Thu 5 PM-12:30 AM\nMonday Closed",
  "bamba-food-square": "Daily 2:30 PM-1 AM",
  "pink-beach": "Daily 2:30 PM-1 AM",
};

const SOCIALS = [
  { Icon: Instagram, href: BUSINESS.social.instagram, label: "Instagram" },
  { Icon: Facebook, href: BUSINESS.social.facebook, label: "Facebook" },
  { Icon: TikTokIcon, href: BUSINESS.social.tiktok, label: "TikTok" },
];

export function SiteFooter() {
  return (
    <footer className="relative pt-20 pb-10 px-5 lg:px-10 bg-linear-to-b from-[var(--blog-footer-from)] to-[var(--blog-footer-to)] border-t border-blog-fg/5">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-6 gap-10 mb-14">
          <div className="md:col-span-2">
            <img
              src={logoImage}
              alt="Hell's Shawarma"
              className="h-16 w-auto object-contain mb-5"
              decoding="async"
              loading="lazy"
            />
            <p className="text-blog-fg/60 max-w-md leading-relaxed">
              Authentic Middle Eastern and Mediterranean cuisine crafted with real spices, proper
              technique, and a burning passion for bold flavour.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Hell's Shawarma on ${label}`}
                  className="grid place-items-center w-10 h-10 rounded-full border border-blog-fg/15 hover:border-[#ff3b14] hover:bg-[#ff3b14]/10 hover:text-blog-link text-white transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <nav aria-label="Footer">
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-blog-fg/55 mb-4">
              Explore
            </div>
            <ul className="space-y-2.5">
              {EXPLORE.map((n) => (
                <li key={n.label}>
                  {n.href.includes("#") ? (
                    <a
                      href={n.href}
                      className="text-sm text-blog-fg/75 hover:text-blog-link transition"
                    >
                      {n.label}
                    </a>
                  ) : (
                    <Link
                      to={n.href as "/blog"}
                      className="text-sm text-blog-fg/75 hover:text-blog-link transition"
                    >
                      {n.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-2">
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-blog-fg/55 mb-4">
              Locations
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm text-blog-fg/75">
              {BRANCHES.map((b) => (
                <li key={b.id}>
                  <span className="font-semibold text-blog-fg/85">{b.name}</span>
                  <br />
                  {b.address}
                  <br />
                  <span className="whitespace-pre-line">{BRANCH_HOURS[b.id]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-blog-fg/55 mb-4">
              Get In Touch
            </div>
            <ul className="space-y-2.5 text-sm text-blog-fg/75">
              <li>
                <a href={`tel:${BUSINESS.phoneE164}`} className="hover:text-blog-link transition">
                  {BUSINESS.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${BUSINESS.email}`} className="hover:text-blog-link transition">
                  {BUSINESS.email}
                </a>
              </li>
              <li>
                <a
                  href={BUSINESS.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blog-link transition"
                >
                  @hells_shawarma
                </a>
              </li>
              <li>
                <a
                  href={BUSINESS.uberEats}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blog-link transition"
                >
                  Order on Uber Eats
                </a>
              </li>
            </ul>
            <div className="mt-5 flex items-center gap-1 text-blog-link text-xs font-bold tracking-[0.2em] uppercase">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
              <span className="ml-2 text-blog-fg/60 font-medium tracking-normal normal-case">
                4.6 on Google
              </span>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-blog-fg/5 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-blog-fg/45">
          <div>© {new Date().getFullYear()} Hell's Shawarma. All rights reserved.</div>
          <div className="tracking-[0.2em] uppercase">Authentic Middle Eastern Cuisine 🔥</div>
        </div>
      </div>
    </footer>
  );
}
