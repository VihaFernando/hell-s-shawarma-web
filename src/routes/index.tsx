import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Flame,
  MapPin,
  Menu as MenuIcon,
  X,
  Facebook,
  Instagram,
  Phone,
  Clock,
  Star,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import logoImage from "@/assets/logo.png";
import menuChicken from "@/assets/menu-chicken.jpg";
import menuBeef from "@/assets/menu-beef.jpg";

import special1 from "@/assets/special1.png";
import special2 from "@/assets/special2.png";
import special3 from "@/assets/special3.png";
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
  .map((k) => photoModules[k]);
import fireIcon from "@/assets/fire.png";
import burgerIcon from "@/assets/burger.png";
import starIcon from "@/assets/star.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hell's Shawarma & Grill  Authentic Middle Eastern Cuisine" },
      {
        name: "description",
        content:
          "Hell's Shawarma & Grill  Authentic Middle Eastern and Mediterranean Cuisine. Bold shawarmas, loaded fries, legendary flavours.",
      },
      {
        property: "og:title",
        content: "Hell's Shawarma & Grill  Authentic Middle Eastern Cuisine",
      },
      {
        property: "og:description",
        content: "Authentic Middle Eastern and Mediterranean cuisine. One bite and you know.",
      },
      { property: "og:image", content: heroImage },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const NAV_ITEMS = [
  { label: "Home", href: "#home", to: undefined },
  { label: "Menu", href: undefined, to: "/menu" as const },
  { label: "Special Offers", href: "#blends", to: undefined },
  { label: "Gallery", href: undefined, to: "/gallery" as const },
  { label: "Locations", href: "#contact", to: undefined },
];

function Landing() {
  return (
    <div id="home" className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <SpecialBlends />
      <SocialWall />
      <LocationSection />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */
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
        scrolled ? "glass-dark py-3" : "py-5 bg-linear-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10 flex items-center justify-between gap-6">
        <a href="#home" className="shrink-0">
          <img
            src={logoImage}
            alt="Hell's Shawarma & Grill"
            className="h-10 md:h-12 w-auto object-contain"
            decoding="async"
          />
        </a>
        <nav className="hidden lg:flex items-center gap-9">
          {NAV_ITEMS.slice(1).map((n) => {
            if (n.to) {
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className="text-sm font-bold tracking-widest uppercase text-white hover:text-[#ff3b14] transition relative group"
                >
                  {n.label}
                </Link>
              );
            }
            return (
              <a
                key={n.label}
                href={n.href!}
                className="text-sm font-bold tracking-widest uppercase text-white hover:text-[#ff3b14] transition relative group"
              >
                {n.label}
              </a>
            );
          })}
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
          {NAV_ITEMS.map((n) => {
            if (n.to) {
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold tracking-[0.18em] uppercase text-white/90 py-2 border-b border-white/5"
                >
                  {n.label}
                </Link>
              );
            }
            return (
              <a
                key={n.label}
                href={n.href!}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold tracking-[0.18em] uppercase text-white/90 py-2 border-b border-white/5"
              >
                {n.label}
              </a>
            );
          })}
        </motion.div>
      )}
    </header>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[88%_center] sm:object-[84%_center] md:object-[76%_center] lg:object-[82%_center]"
          decoding="async"
        />
        {/* strong dark overlay so text reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </motion.div>

      {/* ember sparks */}
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#ff6a00] opacity-50 pointer-events-none"
          style={{
            left: `${5 + i * 11}%`,
            bottom: `${15 + (i % 4) * 12}%`,
            animation: `ember-rise ${2.5 + i * 0.3}s ease-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 flex-1 flex items-center pt-24 pb-12 px-5 lg:px-10"
      >
        <div className="mx-auto max-w-7xl w-full grid lg:grid-cols-2 place-items-center lg:place-items-start">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex flex-col items-center lg:items-start"
          >
            {/* brand name  HELL'S big, the rest smaller */}
            <h1 className="font-display text-white leading-[0.88] tracking-normal uppercase text-center lg:text-left">
              <span className="block text-[#ff3b14] text-[clamp(5rem,20vw,13rem)] leading-[0.82]">
                HELL'S
              </span>
              <span className="block text-[clamp(2.2rem,8vw,5.5rem)] leading-[1]">SHAWARMA</span>
              <span className="block text-[clamp(1.4rem,5vw,3.2rem)] leading-[1.1] text-white/70 font-bold tracking-[0.12em]">
                &amp; GRILL
              </span>
            </h1>

            <p className="mt-5 text-white/60 text-sm sm:text-base tracking-[0.25em] uppercase font-semibold text-center lg:text-left">
              Authentic Middle Eastern &amp; Mediterranean Cuisine
            </p>

            <div className="mt-4 flex items-center gap-3 sm:gap-5 text-sm sm:text-base font-semibold tracking-normal uppercase text-white/80">
              <span>Shawarmas</span>
              <span className="w-[5px] h-[5px] rounded-full bg-[#ff3b14] shrink-0" />
              <span>Plates</span>
              <span className="w-[5px] h-[5px] rounded-full bg-[#ff3b14] shrink-0" />
              <span>Loaded Fries</span>
              <span className="w-[5px] h-[5px] rounded-full bg-[#ff3b14] shrink-0" />
              <span>Grills</span>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 sm:gap-2.5 bg-[#ff3b14] hover:bg-[#ff5a2a] text-white px-5 py-2 sm:px-8 sm:py-3.5 rounded-md font-semibold tracking-wider text-xs sm:text-sm uppercase transition-all shadow-[0_0_20px_rgba(255,59,20,0.3)]"
              >
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 fill-current" /> VIEW MENU
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 sm:gap-2.5 bg-black border border-white/30 hover:border-white text-white px-5 py-2 sm:px-8 sm:py-3.5 rounded-md font-semibold tracking-widest text-xs sm:text-sm uppercase transition-all"
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> FIND US
              </a>
            </div>

            {/* phone */}
            <div className="mt-6 flex items-center gap-2 text-white/50 text-sm">
              <Phone className="w-4 h-4 text-[#ff3b14]" />
              <span className="tracking-widest font-semibold">072 320 5285</span>
            </div>
          </motion.div>
          <div className="hidden lg:block" />
        </div>
      </motion.div>

      {/* feature strip overlay */}
      <div className="relative z-10 w-full">
        <FeatureBar />
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: fireIcon, title: "Real Charcoal Grill", desc: "Slow-roasted on open flame" },
  { icon: burgerIcon, title: "Loaded Shawarmas", desc: "Stuffed to the max" },
  { icon: starIcon, title: "Signature Sauces", desc: "House-made toum & zhoug" },
  { icon: fireIcon, title: "Halal Certified", desc: "100% Halal meat" },
];

function FeatureBar() {
  return (
    <div className="glass-dark border-y border-white/5">
      <div className="mx-auto max-w-7xl px-5 lg:px-10 grid grid-cols-2 sm:grid-cols-4 [&>*]:border-r [&>*]:border-white/5 [&>*:nth-child(2)]:border-r-0 sm:[&>*:nth-child(2)]:border-r [&>*:nth-child(3)]:border-t sm:[&>*:nth-child(3)]:border-t-0 [&>*:nth-child(4)]:border-t [&>*:nth-child(4)]:border-r-0 sm:[&>*:nth-child(4)]:border-t-0 sm:[&>*:nth-child(4)]:border-r-0 [&>*:last-child]:border-r-0">
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-3 py-5 px-4 sm:px-5 md:px-8">
            <img
              src={f.icon}
              alt=""
              aria-hidden="true"
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div>
              <div className="uppercase tracking-[0.08em] text-[11px] sm:text-xs md:text-[13px] text-white leading-tight">
                {f.title}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-white/40 mt-0.5 hidden sm:block">
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- SECTION TITLE ---------------- */
function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center mb-14 md:mb-20">
      <div className="inline-flex items-center gap-2 text-[#ff6a00] tracking-[0.3em] text-xs font-bold uppercase mb-4">
        <span className="h-px w-8 bg-[#ff6a00]" /> {kicker}{" "}
        <span className="h-px w-8 bg-[#ff6a00]" />
      </div>
      <h2 className="font-display text-white leading-[0.9] text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
        {title}
      </h2>
    </div>
  );
}

/* ---------------- SPECIAL OFFERS ---------------- */
const OFFERS = [
  { img: special1, alt: "Special Offer 1" },
  { img: special2, alt: "Special Offer 2" },
  { img: special3, alt: "Special Offer 3" },
];

function SpecialBlends() {
  return (
    <section
      id="blends"
      className="relative py-24 md:py-32 px-5 lg:px-10 bg-linear-to-b from-black via-[#0a0506] to-black overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(255,106,0,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionTitle kicker="Limited Time" title="SPECIAL OFFERS" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {OFFERS.map((offer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden border border-[#ff3b14]/40 hover:border-[#ff3b14] transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(255,59,20,0.3),0_8px_32px_rgba(255,59,20,0.3)]"
            >
              <img
                src={offer.img}
                alt={offer.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- GALLERY PREVIEW ---------------- */
const GALLERY_PREVIEW = PHOTOS.slice(0, 6);

function CollageImage({
  src,
  alt,
  delay,
  className,
}: {
  src: string;
  alt: string;
  delay: number;
  className: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay }}
      className={`group relative overflow-hidden rounded-2xl ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
    </motion.div>
  );
}

function SocialWall() {
  return (
    <section id="gallery" className="relative pt-8 pb-0 px-5 lg:px-10 bg-black">
      <div className="relative mx-auto max-w-7xl">
        <SectionTitle kicker="Our Food" title="FROM THE KITCHEN" />

        {/* Mobile: 2×2 square grid */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {GALLERY_PREVIEW.slice(0, 4).map((src, i) => (
            <CollageImage
              key={i}
              src={src}
              alt={`Hell's Shawarma dish ${i + 1}`}
              delay={i * 0.08}
              className="aspect-square"
            />
          ))}
        </div>

        {/* Tablet portrait (md)  two equal cols, left full height, right stacked */}
        <div className="hidden md:flex lg:hidden gap-4 h-125">
          <CollageImage
            src={GALLERY_PREVIEW[0]}
            alt="Hell's Shawarma signature dish"
            delay={0}
            className="flex-1"
          />
          <div className="flex flex-col gap-4 flex-1">
            <CollageImage
              src={GALLERY_PREVIEW[1]}
              alt="Hell's Shawarma dish"
              delay={0.1}
              className="flex-1"
            />
            <CollageImage
              src={GALLERY_PREVIEW[2]}
              alt="Hell's Shawarma dish"
              delay={0.18}
              className="flex-1"
            />
          </div>
        </div>

        {/* Desktop  reference layout: large left, tall center, two stacked right */}
        <div className="hidden lg:flex gap-4 h-145">
          <CollageImage
            src={GALLERY_PREVIEW[0]}
            alt="Hell's Shawarma signature dish"
            delay={0}
            className="w-[44%] shrink-0"
          />
          <CollageImage
            src={GALLERY_PREVIEW[1]}
            alt="Hell's Shawarma dish"
            delay={0.1}
            className="flex-1"
          />
          <div className="flex flex-col gap-4 w-[22%] shrink-0">
            <CollageImage
              src={GALLERY_PREVIEW[2]}
              alt="Hell's Shawarma dish"
              delay={0.18}
              className="flex-1"
            />
            <CollageImage
              src={GALLERY_PREVIEW[3]}
              alt="Hell's Shawarma dish"
              delay={0.26}
              className="flex-1"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 mb-16 md:mb-20 flex justify-center"
        >
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-md border border-[#ff3b14] px-8 py-3 text-sm font-bold tracking-[0.1em] uppercase text-white hover:bg-[#ff3b14] transition-all"
          >
            View Full Gallery
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- LOCATION ---------------- */
function LocationSection() {
  return (
    <section id="contact" className="relative py-24 md:py-32 px-5 lg:px-10 bg-black">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="Come Visit Us" title="FIND HELL'S" />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="relative aspect-4/3 lg:aspect-auto rounded-2xl overflow-hidden glass-dark border-white/10">
            <iframe
              title="Hell's Shawarma & Grill location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.235983750658!2d79.86148147598695!3d6.862297519131488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25be80c90d25d%3A0x37c04fe78f2dde8b!2sHell&#39;s%20Shawarma%20%26%20Grill!5e0!3m2!1sen!2slk!4v1782395176950!5m2!1sen!2slk"
              className="w-full h-full grayscale contrast-125 opacity-85"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(255,59,20,0.15))]" />
          </div>
          <div className="glass-dark rounded-2xl p-8 md:p-10 border-white/10">
            <div className="space-y-6">
              <InfoRow
                icon={MapPin}
                label="Address"
                value="Fusion Food Court, 9 Galle Rd, Dehiwala-Mount Lavinia 10350"
              />
              <InfoRow
                icon={Clock}
                label="Opening Hours"
                value={"Mon–Thu  11:00  23:00\nFri–Sun  11:00  01:00"}
              />
              <InfoRow icon={Phone} label="Contact" value="072 320 5285" />
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="tel:0723205285"
                className="inline-flex items-center gap-2 bg-[#ff3b14] hover:bg-[#ff5a2a] text-white px-6 py-3.5 rounded-md font-bold text-xs uppercase tracking-[0.18em] transition hover:glow-flame"
              >
                <Phone className="w-4 h-4" /> Call to Order
              </a>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/50 text-white px-6 py-3.5 rounded-md font-bold text-xs uppercase tracking-[0.18em] transition"
              >
                <Flame className="w-4 h-4" /> View Menu
              </Link>
              <a
                href="https://www.ubereats.com/lk/store/hells-shawarma-%26-grill/ZM3tJn6fRe-RtiSWcW0rdA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-[#ff3b14] hover:text-[#ff3b14] text-white px-6 py-3.5 rounded-md font-bold text-xs uppercase tracking-[0.18em] transition"
              >
                🛵 Uber Eats
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-[#ff3b14]/15 text-[#ff6a00] border border-[#ff3b14]/30">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/55 mb-1">
          {label}
        </div>
        <div className="text-white font-medium whitespace-pre-line">{value}</div>
      </div>
    </div>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer className="relative pt-20 pb-10 px-5 lg:px-10 bg-linear-to-b from-black to-[#1a0606] border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-10 mb-14">
          <div className="md:col-span-2">
            <img
              src={logoImage}
              alt="Hell's Shawarma & Grill"
              className="h-16 w-auto object-contain mb-5"
              decoding="async"
            />
            <p className="text-white/60 max-w-md leading-relaxed">
              Authentic Middle Eastern and Mediterranean cuisine crafted with real spices, proper
              technique, and a burning passion for bold flavour.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                {
                  Icon: Instagram,
                  href: "https://www.instagram.com/hells_shawarma/",
                },
                {
                  Icon: Facebook,
                  href: "https://www.facebook.com/p/Hells-Shawarma-Grill-61569893127389/",
                },
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
                  {n.to ? (
                    <Link
                      to={n.to}
                      className="text-sm text-white/75 hover:text-[#ff6a00] transition"
                    >
                      {n.label}
                    </Link>
                  ) : (
                    <a
                      href={n.href!}
                      className="text-sm text-white/75 hover:text-[#ff6a00] transition"
                    >
                      {n.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.22em] uppercase text-white/55 mb-4">
              Get In Touch
            </div>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                Fusion Food Court, 9 Galle Rd,
                <br />
                Dehiwala-Mount Lavinia 10350
              </li>
              <li>
                <a href="tel:0723205285" className="hover:text-[#ff6a00] transition">
                  072 320 5285
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/hells_shawarma/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff6a00] transition"
                >
                  @hells_shawarma
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
                4.9 on Google
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
