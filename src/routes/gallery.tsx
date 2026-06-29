import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Menu as MenuIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import logoImage from "@/assets/logo.png";

const photoModules = import.meta.glob("../assets/photos/*.JPG", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const PHOTOS = Object.keys(photoModules)
  .sort((a, b) => {
    const numA = parseInt(a.match(/g(\d+)\.JPG$/)?.[1] ?? "0");
    const numB = parseInt(b.match(/g(\d+)\.JPG$/)?.[1] ?? "0");
    return numA - numB;
  })
  .map((key) => photoModules[key]);

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery  Hell's Shawarma & Grill" },
      {
        name: "description",
        content: "Browse photos from Hell's Shawarma & Grill  authentic Middle Eastern cuisine.",
      },
    ],
  }),
  component: GalleryPage,
});

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Special Offers", href: "/#blends" },
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
          {NAV_ITEMS.slice(1).map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-sm font-bold tracking-widest uppercase text-white hover:text-[#ff3b14] transition"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/menu"
            className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#ff3b14] px-6 py-2.5 text-sm font-bold tracking-[0.05em] uppercase text-white hover:bg-[#ff3b14] transition-all"
          >
            Order Now <Flame className="w-4 h-4 text-[#ff3b14]" />
          </Link>
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
          {NAV_ITEMS.map((n) => (
            <a
              key={n.label}
              href={n.href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold tracking-[0.18em] uppercase text-white/90 py-2 border-b border-white/5"
            >
              {n.label}
            </a>
          ))}
        </motion.div>
      )}
    </header>
  );
}

function Lightbox({
  index,
  onClose,
  onPrev,
  onNext,
}: {
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 md:left-8 grid place-items-center w-11 h-11 rounded-full glass-dark border border-white/10 hover:border-[#ff3b14] text-white transition z-10"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <motion.div
        key={index}
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={PHOTOS[index]}
          alt={`Hell's Shawarma photo ${index + 1}`}
          className="w-full max-h-[82vh] object-contain rounded-xl"
        />
        <div className="mt-3 text-center text-xs text-white/35 tracking-widest uppercase">
          {index + 1} / {PHOTOS.length}
        </div>
      </motion.div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 md:right-8 grid place-items-center w-11 h-11 rounded-full glass-dark border border-white/10 hover:border-[#ff3b14] text-white transition z-10"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-full glass-dark border border-white/10 hover:border-[#ff3b14] text-white transition"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const prev = () =>
    setLightboxIndex((i) => (i === null ? 0 : (i - 1 + PHOTOS.length) % PHOTOS.length));
  const next = () => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % PHOTOS.length));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero banner */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-5 lg:px-10 bg-gradient-to-b from-black via-[#0a0506] to-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,59,20,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 text-[#ff6a00] tracking-[0.3em] text-xs font-bold uppercase mb-4">
            <span className="h-px w-8 bg-[#ff6a00]" /> Our Food{" "}
            <span className="h-px w-8 bg-[#ff6a00]" />
          </div>
          <h1 className="font-display text-white leading-[0.9] text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase">
            Gallery
          </h1>
          <p className="mt-5 text-white/50 text-sm tracking-[0.2em] uppercase">
            A feast for the eyes before the feast for the soul
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="relative py-16 md:py-20 px-5 lg:px-10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {PHOTOS.map((src, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-square rounded-xl overflow-hidden glass-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b14]"
              >
                <img
                  src={src}
                  alt={`Hell's Shawarma photo ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-5 lg:px-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-white/45">
          <div>© {new Date().getFullYear()} Hell's Shawarma & Grill. All rights reserved.</div>
          <div className="tracking-[0.2em] uppercase">Authentic Middle Eastern Cuisine 🔥</div>
        </div>
      </footer>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
