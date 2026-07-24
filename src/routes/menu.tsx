import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Menu as MenuIcon, X, MapPin, Star } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82c-.9-.79-1.47-1.94-1.47-3.22h-3.13v13.44a2.6 2.6 0 1 1-2.6-2.6c.24 0 .47.03.69.09V10.4a5.73 5.73 0 0 0-.69-.04A5.73 5.73 0 1 0 15.13 16V9.4a8.15 8.15 0 0 0 4.71 1.5V7.77a4.85 4.85 0 0 1-3.24-1.95z" />
    </svg>
  );
}
import logoImage from "@/assets/new-logo.png";
import menuBg from "@/assets/menu.png";
import snackPackImg from "@/assets/snack-pack.png";
import chickenShawarmaImg from "@/assets/photos/g2.JPG";
import hummusPlateImg from "@/assets/photos/g6.JPG";
import shawarmaPlateImg from "@/assets/photos/g7.JPG";
import beefShawarmaImg from "@/assets/photos/g8.JPG";
import menuData from "@/assets/menu.json";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu  Hell's Shawarma & Grill" },
      {
        name: "description",
        content:
          "Authentic Middle Eastern & Asian Cuisine. Chicken Shawarmas, Beef Shawarmas, Plates & More.",
      },
    ],
  }),
  component: MenuPage,
});

/* ─── NAV ─── */
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Featured", href: "/#blends" },
  { label: "Gallery", href: "/gallery" },
  { label: "Locations", href: "/#contact" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-dark py-3" : "py-5 bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10 flex items-center justify-between gap-6">
        <Link to="/" className="shrink-0">
          <img
            src={logoImage}
            alt="Hell's Shawarma & Grill"
            className="h-10 md:h-12 w-auto object-contain"
            decoding="async"
          />
        </Link>
        <nav className="hidden lg:flex items-center gap-9">
          {NAV_ITEMS.slice(1).map((n) =>
            n.href.startsWith("/") && !n.href.includes("#") ? (
              <Link
                key={n.label}
                to={n.href as "/menu"}
                className="text-sm font-bold tracking-widest uppercase text-white hover:text-[#ff3b14] transition"
              >
                {n.label}
              </Link>
            ) : (
              <a
                key={n.label}
                href={n.href}
                className="text-sm font-bold tracking-widest uppercase text-white hover:text-[#ff3b14] transition"
              >
                {n.label}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="tel:0723205285"
            className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#ff3b14] px-6 py-2.5 text-sm font-bold tracking-[0.05em] uppercase text-white hover:bg-[#ff3b14] transition-all"
          >
            Call Now <Flame className="w-4 h-4 text-[#ff3b14]" />
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden grid place-items-center w-10 h-10 rounded-full glass-dark"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden mt-3 mx-5 rounded-2xl glass-dark p-5 flex flex-col gap-3"
        >
          {NAV_ITEMS.map((n) =>
            n.href.startsWith("/") && !n.href.includes("#") ? (
              <Link
                key={n.label}
                to={n.href as "/menu"}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold tracking-[0.18em] uppercase text-white/90 py-2 border-b border-white/5"
              >
                {n.label}
              </Link>
            ) : (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold tracking-[0.18em] uppercase text-white/90 py-2 border-b border-white/5"
              >
                {n.label}
              </a>
            ),
          )}
        </motion.div>
      )}
    </header>
  );
}

/* ─── SPICY INDICATOR ─── */
const SPICY_IDS = new Set([1, 5, 7, 11]);
const VERY_SPICY_IDS = new Set([4, 6, 10, 12]);
const TRIPLE_SPICY_IDS = new Set([2, 8]);

function SpicyFlames({ id }: { id: number }) {
  if (TRIPLE_SPICY_IDS.has(id)) return <span className="inline-block whitespace-nowrap text-[#ff3b14] ml-1">🔥🔥🔥</span>;
  if (VERY_SPICY_IDS.has(id)) return <span className="inline-block whitespace-nowrap text-[#ff3b14] ml-1">🔥🔥</span>;
  if (SPICY_IDS.has(id)) return <span className="inline-block whitespace-nowrap text-[#ff3b14] ml-1">🔥</span>;
  return null;
}

/* ─── SECTION HEADER ─── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const parts = title.split(" ");
  const first = parts[0];
  const rest = parts.slice(1).join(" ");
  return (
    <div className="flex items-center gap-3 mb-3 mt-0">
      <span className="text-[#ff3b14]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.5 5 7 8 8 12c-2-1-3-3-2.5-5.5C3 8.5 2 11 3 14c1 4 5 7 9 7s8-3 9-7c1-4-1-7-3-9-1 3-2 4-3 4 1-3 0-6-3-7z"/>
        </svg>
      </span>
      <h2 className="font-display text-white uppercase tracking-wider text-2xl md:text-3xl">
        <span className="text-white">{first}</span>{" "}
        <span className="text-[#ff3b14]">{rest}</span>
      </h2>
      {subtitle && (
        <span className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase hidden sm:block">
          {subtitle}
        </span>
      )}
    </div>
  );
}

/* ─── MENU ITEM ROW ─── */
interface MenuItem {
  id: number;
  name: string;
  price: number;
  ingredients?: string[];
}

function CategoryImage({
  src,
  alt,
  position = "object-center",
  height = "h-52 sm:h-64 lg:h-72",
}: {
  src: string;
  alt: string;
  position?: string;
  height?: string;
}) {
  return (
    <div className={`relative ${height} overflow-hidden`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${position}`}
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
    </div>
  );
}

function MenuItemRow({ item, showDivider }: { item: MenuItem; showDivider: boolean }) {
  const ingredientsStr = item.ingredients?.join(", ");
  const paddedId = String(item.id).padStart(2, "0");

  return (
    <div>
      <div className="flex items-start gap-3 px-4 py-4">
        <span className="shrink-0 text-[#ff3b14]/60 font-display text-base w-8 leading-tight pt-0.5">
          {paddedId}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 sm:gap-6 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-[16px] sm:text-[17px] leading-snug break-words">
                {item.name}
                <SpicyFlames id={item.id} />
              </p>
              {ingredientsStr && (
                <p className="text-white/40 text-[13px] sm:text-[14px] leading-relaxed mt-1.5 break-words">
                  {ingredientsStr}
                </p>
              )}
            </div>
            <span className="shrink-0 text-white font-bold text-[16px] sm:text-[17px] tabular-nums pt-0.5">
              {item.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      {showDivider && <div className="h-px border-t border-dashed border-white/10 mx-4" />}
    </div>
  );
}

/* ─── ADD-ONS GRID ─── */
interface AddOnItem {
  id: number;
  name: string;
  price: number;
}

function AddOnsGrid({ items }: { items: AddOnItem[] }) {
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
      <div>
        {left.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/8">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 text-[#ff3b14]/50 font-display text-xs w-5">{String(item.id).padStart(2, "0")}</span>
              <span className="text-white/80 text-[14px] break-words">{item.name}</span>
            </div>
            <span className="shrink-0 text-white font-bold text-[14px] tabular-nums">{item.price.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div>
        {right.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/8">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 text-[#ff3b14]/50 font-display text-xs w-5">{String(item.id).padStart(2, "0")}</span>
              <span className="text-white/80 text-[14px] break-words">{item.name}</span>
            </div>
            <span className="shrink-0 text-white font-bold text-[14px] tabular-nums">{item.price.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
function MenuPage() {
  const categories = menuData.categories;
  const currency = menuData.currency;

  const chicken = categories.find((c) => c.id === "chicken_shawarma_wraps")!;
  const beef = categories.find((c) => c.id === "beef_shawarma_wraps")!;
  const hummus = categories.find((c) => c.id === "hummus_plate")!;
  const shawarmaPlate = categories.find((c) => c.id === "shawarma_plate")!;
  const falafel = categories.find((c) => c.id === "falafel_wrap")!;
  const snackPack = categories.find((c) => c.id === "snack_pack")!;
  const addons = categories.find((c) => c.id === "addons")!;


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background image  full width, no crop on mobile via object-position */}
        <img
          src={menuBg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-[70%_30%] sm:object-[center_30%]"
        />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-10 pt-36 pb-20 sm:pt-44 sm:pb-28 flex flex-col items-start">
          <p className="text-[#ff6a00] text-xs font-bold tracking-[0.35em] uppercase mb-4">
             Authentic Middle Eastern & Asian Cuisine 
          </p>
          <h1 className="font-display text-white leading-[0.88] uppercase text-[clamp(3.2rem,10vw,7rem)]">
            <span className="text-[#ff3b14]">HELL'S</span> MENU
          </h1>
          <p className="mt-4 text-white/60 tracking-[0.25em] uppercase text-sm font-semibold">
            Bold. Spicy. Authentic.
          </p>
        </div>
      </section>

      {/* ── MENU BODY ── */}
      <section className="px-5 lg:px-10 pb-16 max-w-7xl mx-auto">
        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#ff3b14]/40 to-[#ff3b14]/40" />
          <Flame className="w-5 h-5 text-[#ff3b14]" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#ff3b14]/40 to-[#ff3b14]/40" />
        </div>

        <div className="grid lg:grid-cols-2 gap-x-12">
          {/* Left col */}
          <div className="flex flex-col gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <SectionHeader title="CHICKEN SHAWARMA WRAPS" />
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                {chicken.items.map((item, i) => (
                  <MenuItemRow key={item.id} item={item} showDivider={i < chicken.items.length - 1} />
                ))}
                <CategoryImage
                  src={chickenShawarmaImg}
                  alt="Chicken Shawarma Wrap"
                  position="object-[50%_58%]"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}>
              <SectionHeader title="BEEF SHAWARMA WRAPS" />
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                {beef.items.map((item, i) => (
                  <MenuItemRow key={item.id} item={item} showDivider={i < beef.items.length - 1} />
                ))}
                <CategoryImage
                  src={beefShawarmaImg}
                  alt="Beef Shawarma Wrap"
                  position="object-[50%_55%]"
                  height="h-52 sm:h-64 lg:h-88"
                />
              </div>
            </motion.div>

          </div>

          {/* Right col */}
          <div className="flex flex-col gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="lg:mt-0 mt-4">
              <SectionHeader title="HUMMUS PLATE" />
              {"base_includes" in hummus && (
                <p className="text-white/40 text-xs leading-relaxed mb-3 px-4">
                  {(hummus as typeof hummus & { base_includes: string[] }).base_includes.join(", ")}
                </p>
              )}
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                {hummus.items.map((item, i) => (
                  <MenuItemRow key={item.id} item={item} showDivider={i < hummus.items.length - 1} />
                ))}
                <CategoryImage
                  src={hummusPlateImg}
                  alt="Hummus Plate"
                  position="object-[50%_58%] sm:object-[50%_62%]"
                />
              </div>
              <p className="mt-3 text-right text-[#ff3b14]/70 font-display italic text-2xl tracking-wider pr-2">
                Bold. Spicy. Authentic.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}>
              <SectionHeader title="SHAWARMA PLATE" />
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                {shawarmaPlate.items.map((item, i) => (
                  <MenuItemRow key={item.id} item={item} showDivider={i < shawarmaPlate.items.length - 1} />
                ))}
                <CategoryImage
                  src={shawarmaPlateImg}
                  alt="Shawarma Plate"
                  position="object-[50%_48%]"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <SectionHeader title="FALAFEL WRAP (VEG)" />
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                {falafel.items.map((item, i) => (
                  <MenuItemRow key={item.id} item={item} showDivider={i < falafel.items.length - 1} />
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
              <SectionHeader title="HELL'S SNACK PACK" subtitle="★" />
              <div className="rounded-xl border border-[#ff3b14]/30 bg-[#ff3b14]/5 overflow-hidden">
                {snackPack.items.map((item, i) => (
                  <MenuItemRow key={item.id} item={item} showDivider={i < snackPack.items.length - 1} />
                ))}
                <CategoryImage src={snackPackImg} alt="Hell's Snack Pack" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── ADD-ONS  full width ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#ff3b14]/30 to-[#ff3b14]/30" />
            <SectionHeader title="ADD-ONS" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#ff3b14]/30 to-[#ff3b14]/30" />
          </div>
          <div className="rounded-xl border border-white/8 bg-white/2 p-4">
            <AddOnsGrid items={addons.items} />
          </div>
          <p className="text-white/30 text-xs text-center mt-3 tracking-[0.15em] uppercase">
            All prices in {currency}
          </p>
        </motion.div>

        {/* ── CONTACT BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-xl border border-white/8 bg-white/2 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 text-white/70">
            <MapPin className="w-4 h-4 text-[#ff3b14] shrink-0" />
            <span className="text-sm">
              Dehiwala: Fusion Food Court, 9 Galle Rd, Dehiwala-Mount Lavinia 10350
              <br />
              Marine Drive: No.18, Marine Drive, Kollupitiya
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:0723205285"
              className="text-white font-bold tracking-widest text-sm hover:text-[#ff3b14] transition"
            >
              072 320 5285
            </a>
            <span className="text-white/20">|</span>
            <p className="font-display text-[#ff3b14] uppercase tracking-wider text-sm">
              We Grill, You Chill
            </p>
          </div>
        </motion.div>
      </section>

      <MenuFooter />
    </div>
  );
}

/* ─── FOOTER ─── */
function MenuFooter() {
  return (
    <footer className="relative pt-20 pb-10 px-5 lg:px-10 bg-gradient-to-b from-black to-[#1a0606] border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-5 gap-10 mb-14">
          <div className="md:col-span-2">
            <img
              src={logoImage}
              alt="Hell's Shawarma & Grill"
              className="h-16 w-auto object-contain mb-5"
              decoding="async"
            />
            <p className="text-white/60 max-w-md leading-relaxed">
              Authentic Middle Eastern and Asian cuisine  crafted with real spices, proper technique,
              and a burning passion for bold flavour.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { Icon: InstagramIcon, href: "https://www.instagram.com/hells_shawarma/" },
                { Icon: FacebookIcon, href: "https://www.facebook.com/p/Hells-Shawarma-Grill-61569893127389/" },
                { Icon: TikTokIcon, href: "https://www.tiktok.com/discover/hells-shawarma?is_from_webapp=1&sender_device=pc" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid place-items-center w-10 h-10 rounded-full border border-white/15 hover:border-[#ff3b14] hover:bg-[#ff3b14]/10 hover:text-[#ff6a00] text-white transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-white/55 mb-4">
              Explore
            </div>
            <ul className="space-y-2.5">
              {NAV_ITEMS.map((n) => (
                <li key={n.label}>
                  {n.href.startsWith("/") && !n.href.includes("#") ? (
                    <Link
                      to={n.href as "/menu"}
                      className="text-sm text-white/75 hover:text-[#ff6a00] transition"
                    >
                      {n.label}
                    </Link>
                  ) : (
                    <a href={n.href} className="text-sm text-white/75 hover:text-[#ff6a00] transition">
                      {n.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-white/55 mb-4">
              Locations
            </div>
            <ul className="space-y-3.5 text-sm text-white/75">
              <li>
                <span className="font-semibold text-white/85">Dehiwala</span>
                <br />
                Fusion Food Court, 9 Galle Rd,<br />Dehiwala-Mount Lavinia 10350
                <br />
                Daily 2:30 PM-1 AM
              </li>
              <li>
                <span className="font-semibold text-white/85">Marine Drive</span>
                <br />
                No.18, Marine Drive, Kollupitiya
                <br />
                Fri-Sun 5:00 PM-1 AM, Tue-Thu 5:00 PM-12:30 AM
                <br />
                Monday Closed
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-white/55 mb-4">
              Get In Touch
            </div>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <a href="tel:0723205285" className="hover:text-[#ff6a00] transition">
                  072 320 5285
                </a>
              </li>
              <li>
                <a href="mailto:hells.shawarma@gmail.com" className="hover:text-[#ff6a00] transition">
                  hells.shawarma@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.ubereats.com/lk/store/hells-shawarma-%26-grill/ZM3tJn6fRe-RtiSWcW0rdA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff6a00] transition"
                >
                  Order on Uber Eats
                </a>
              </li>
            </ul>
            <div className="mt-5 flex items-center gap-1 text-[#ff6a00] text-xs font-bold tracking-[0.2em] uppercase">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
              <span className="ml-2 text-white/60 font-medium tracking-normal normal-case">
                4.6 on Google
              </span>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-white/45">
          <div>© {new Date().getFullYear()} Hell's Shawarma & Grill. All rights reserved.</div>
          <div className="tracking-[0.2em] uppercase">Authentic Middle Eastern Cuisine 🔥</div>
        </div>
      </div>
    </footer>
  );
}
