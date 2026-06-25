import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Flame,
  Menu as MenuIcon,
  X,
  MapPin,
  Instagram,
  Facebook,
  Star,
  ShoppingBag,
  UtensilsCrossed,
  GlassWater,
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import shawarmaChicken from "@/assets/shawarma-chicken.jpg";
import shawarmaBeef from "@/assets/shawarma-beef.jpg";
import shawarmaPlate from "@/assets/shawarma-plate.jpg";
import hummusPlate from "@/assets/hummus-plate.jpg";
import falafelImg from "@/assets/falafel.jpg";
import loadedFries from "@/assets/loaded-fries.jpg";
import drinkImg from "@/assets/drink.jpg";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Hell's Shawarma & Grill" },
      {
        name: "description",
        content:
          "Authentic Middle Eastern & Mediterranean Cuisine. Chicken Shawarmas, Beef Shawarmas, Plates & More.",
      },
    ],
  }),
  component: MenuPage,
});

/* ─── NAV ─── */
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Special Offers", href: "/#blends" },
  { label: "Gallery", href: "/#gallery" },
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
            href="#menu-grid"
            className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#ff3b14] px-6 py-2.5 text-sm font-bold tracking-[0.05em] uppercase text-white hover:bg-[#ff3b14] transition-all"
          >
            Order Now <Flame className="w-4 h-4 text-[#ff3b14]" />
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

/* ─── MENU DATA ─── */
type Category =
  | "all"
  | "chicken-wraps"
  | "beef-wraps"
  | "hummus-plates"
  | "shawarma-plates"
  | "falafel"
  | "snack-packs"
  | "add-ons";

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Items", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "chicken-wraps", label: "Chicken Wraps", icon: <Flame className="w-4 h-4" /> },
  { id: "beef-wraps", label: "Beef Wraps", icon: <Flame className="w-4 h-4" /> },
  { id: "hummus-plates", label: "Hummus Plates", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "shawarma-plates", label: "Shawarma Plates", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "falafel", label: "Falafel (Veg)", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "snack-packs", label: "Snack Packs", icon: <GlassWater className="w-4 h-4" /> },
  { id: "add-ons", label: "Add-ons", icon: <GlassWater className="w-4 h-4" /> },
];

const MENU_ITEMS = [
  /* ── CHICKEN SHAWARMA WRAPS ── */
  {
    num: "01",
    name: "Authentic Middle Eastern Chicken Shawarma",
    desc: "Marinated Chicken, French Fries, Garlic Sauce/Toum, Pomegranate Molasses, Red Chilli Tomato Sauce, Homemade Pickles",
    price: "LKR 1,500",
    img: shawarmaChicken,
    tag: null,
    spicy: 1,
    categories: ["all", "chicken-wraps"] as Category[],
  },
  {
    num: "02",
    name: "Chilli Chicken Shawarma",
    desc: "Marinated Chicken, French Fries, Garlic Sauce/Toum, Pomegranate Molasses, Red Chilli Tomato Sauce, Homemade Pickles, Spicy Shatta Sauce, Paprika Peppers, Chilli Pickles",
    price: "LKR 1,600",
    img: shawarmaChicken,
    tag: null,
    spicy: 3,
    categories: ["all", "chicken-wraps"] as Category[],
  },
  {
    num: "03",
    name: "Cheesy Chicken Shawarma",
    desc: "Marinated Chicken, French Fries, Garlic Sauce/Toum, Pomegranate Molasses, Homemade Pickles, Melted Cheese Slices",
    price: "LKR 1,600",
    img: shawarmaChicken,
    tag: null,
    spicy: 0,
    categories: ["all", "chicken-wraps"] as Category[],
  },
  {
    num: "04",
    name: "Yemeni Chicken Shawarma",
    desc: "Marinated Chicken, French Fries, Garlic Sauce/Toum, Homemade Pickles, Onion + Tomato, Chilli Pickles, Zhoug Sauce",
    price: "LKR 1,600",
    img: shawarmaChicken,
    tag: null,
    spicy: 2,
    categories: ["all", "chicken-wraps"] as Category[],
  },
  {
    num: "05",
    name: "Turkish Chicken Shawarma",
    desc: "Marinated Chicken, Tahini, Toum, Olives, Onion + Tomato, Homemade Pickles, Iceberg Lettuce",
    price: "LKR 1,600",
    img: shawarmaChicken,
    tag: null,
    spicy: 1,
    categories: ["all", "chicken-wraps"] as Category[],
  },
  {
    num: "06",
    name: "Palestinian Chicken Shawarma",
    desc: "Marinated Chicken, Hummus, French Fries, Garlic Sauce/Toum, Pomegranate Molasses, Homemade Pickles, Spicy Shatta Sauce, Iceberg Lettuce, Paprika Peppers, Olives",
    price: "LKR 1,700",
    img: shawarmaChicken,
    tag: null,
    spicy: 2,
    categories: ["all", "chicken-wraps"] as Category[],
  },
  /* ── BEEF SHAWARMA WRAPS ── */
  {
    num: "07",
    name: "Authentic Middle Eastern Beef Shawarma",
    desc: "Marinated Beef, French Fries, Garlic Sauce/Toum, Red Chilli Tomato Sauce, Homemade Pickles",
    price: "LKR 1,700",
    img: shawarmaBeef,
    tag: null,
    spicy: 1,
    categories: ["all", "beef-wraps"] as Category[],
  },
  {
    num: "08",
    name: "Chilli Beef Shawarma",
    desc: "Marinated Beef, French Fries, Garlic Sauce/Toum, Red Chilli Tomato Sauce, Homemade Pickles, Spicy Shatta Sauce, Paprika Peppers, Chilli Pickles",
    price: "LKR 1,800",
    img: shawarmaBeef,
    tag: null,
    spicy: 3,
    categories: ["all", "beef-wraps"] as Category[],
  },
  {
    num: "09",
    name: "Cheesy Beef Shawarma",
    desc: "Marinated Beef, French Fries, Garlic Sauce/Toum, Homemade Pickles, Melted Cheese Slices",
    price: "LKR 1,800",
    img: shawarmaBeef,
    tag: null,
    spicy: 0,
    categories: ["all", "beef-wraps"] as Category[],
  },
  {
    num: "10",
    name: "Yemeni Beef Shawarma",
    desc: "Marinated Beef, French Fries, Garlic Sauce/Toum, Homemade Pickles, Onion + Tomato, Chilli Pickles, Zhoug Sauce",
    price: "LKR 1,800",
    img: shawarmaBeef,
    tag: null,
    spicy: 2,
    categories: ["all", "beef-wraps"] as Category[],
  },
  {
    num: "11",
    name: "Turkish Beef Shawarma",
    desc: "Marinated Beef, Tahini, Toum, Olives, Onion + Tomato, Homemade Pickles, Iceberg Lettuce",
    price: "LKR 1,850",
    img: shawarmaBeef,
    tag: null,
    spicy: 1,
    categories: ["all", "beef-wraps"] as Category[],
  },
  {
    num: "12",
    name: "Palestinian Beef Shawarma",
    desc: "Marinated Beef, Hummus, French Fries, Garlic Sauce/Toum, Spicy Shatta Sauce, Iceberg Lettuce, Paprika Peppers, Olives, Zhoug Sauce",
    price: "LKR 1,900",
    img: shawarmaBeef,
    tag: null,
    spicy: 2,
    categories: ["all", "beef-wraps"] as Category[],
  },
  /* ── HUMMUS PLATES ── */
  {
    num: "13",
    name: "Hummus Plate with Shawarma Chicken",
    desc: "Homemade Hummus, Pita Bread, Shawarma Chicken, Sumac Onions, Varieties of Homemade Pickles, Garlic Sauce/Toum, Cucumber, Cherry Tomato or Olives",
    price: "LKR 1,700",
    img: hummusPlate,
    tag: null,
    spicy: 0,
    categories: ["all", "hummus-plates"] as Category[],
  },
  {
    num: "14",
    name: "Hummus Plate with Shawarma Beef",
    desc: "Homemade Hummus, Pita Bread, Shawarma Beef, Sumac Onions, Varieties of Homemade Pickles, Garlic Sauce/Toum, Cucumber, Cherry Tomato or Olives",
    price: "LKR 1,900",
    img: hummusPlate,
    tag: null,
    spicy: 0,
    categories: ["all", "hummus-plates"] as Category[],
  },
  {
    num: "15",
    name: "Hummus Plate with Fiery Falafels (Veg)",
    desc: "Homemade Hummus, Pita Bread, Fiery Falafels, Sumac Onions, Varieties of Homemade Pickles, Garlic Sauce/Toum, Cucumber, Cherry Tomato or Olives",
    price: "LKR 1,600",
    img: hummusPlate,
    tag: null,
    spicy: 1,
    categories: ["all", "hummus-plates"] as Category[],
  },
  /* ── SHAWARMA PLATES ── */
  {
    num: "16",
    name: "Chicken Shawarma Plate",
    desc: "Marinated Chicken, Pita Bread, French Fries, Garlic Sauce/Toum, Iceberg Lettuce, Homemade Pickles, Pomegranate Molasses, Red Chilli Tomato Sauce",
    price: "LKR 1,750",
    img: shawarmaPlate,
    tag: null,
    spicy: 0,
    categories: ["all", "shawarma-plates"] as Category[],
  },
  {
    num: "17",
    name: "Beef Shawarma Plate",
    desc: "Marinated Beef, Pita Bread, French Fries, Garlic Sauce/Toum, Iceberg Lettuce, Homemade Pickles, Red Chilli Tomato Sauce, Zhoug Sauce",
    price: "LKR 1,950",
    img: shawarmaPlate,
    tag: null,
    spicy: 0,
    categories: ["all", "shawarma-plates"] as Category[],
  },
  /* ── FALAFEL WRAP ── */
  {
    num: "18",
    name: "Middle Eastern Falafel Sandwich (Veg)",
    desc: "Falafels, Tahini + Hummus, Homemade Pickles, Iceberg Lettuce, Onion, Tomato, Cucumber, Paprika Pepper",
    price: "LKR 1,500",
    img: falafelImg,
    tag: "Veg",
    spicy: 0,
    categories: ["all", "falafel"] as Category[],
  },
  /* ── HELL'S SNACK PACK ── */
  {
    num: "19",
    name: "Hell's Chicken Snack Pack",
    desc: "Layers of French Fries with signature in-house Sauces, Marinated Shawarma Chicken & Melty Cheese",
    price: "LKR 2,100",
    img: loadedFries,
    tag: "Fan Fave",
    spicy: 0,
    categories: ["all", "snack-packs"] as Category[],
  },
  {
    num: "20",
    name: "Hell's Beef Snack Pack",
    desc: "Layers of French Fries with signature in-house Sauces, Marinated Shawarma Beef & Melty Cheese",
    price: "LKR 2,300",
    img: loadedFries,
    tag: null,
    spicy: 0,
    categories: ["all", "snack-packs"] as Category[],
  },
  {
    num: "21",
    name: "Hell's Combo Snack Pack (Chicken + Beef)",
    desc: "Layers of French Fries with signature in-house Sauces, Marinated Shawarma Chicken + Beef & Melty Cheese",
    price: "LKR 2,500",
    img: loadedFries,
    tag: "Best Value",
    spicy: 0,
    categories: ["all", "snack-packs"] as Category[],
  },
  /* ── ADD-ONS ── */
  {
    num: "22",
    name: "French Fries (200g)",
    desc: "Crispy golden French Fries.",
    price: "LKR 800",
    img: loadedFries,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "23",
    name: "Cheesy French Fries (200g)",
    desc: "Crispy golden French Fries topped with melted cheese.",
    price: "LKR 900",
    img: loadedFries,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "24",
    name: "Pita Bread (1 pc)",
    desc: "Freshly baked warm pita bread.",
    price: "LKR 200",
    img: falafelImg,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "25",
    name: "Falafel (5 pcs)",
    desc: "Five crispy house-made falafels.",
    price: "LKR 700",
    img: falafelImg,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "26",
    name: "Marinated Chicken (200g)",
    desc: "Extra portion of our signature marinated shawarma chicken.",
    price: "LKR 1,200",
    img: shawarmaChicken,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "27",
    name: "Hummus Dip (150g)",
    desc: "Creamy house-made hummus dip.",
    price: "LKR 1,000",
    img: hummusPlate,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "28",
    name: "Lebaan (Sweet / Salty)",
    desc: "Traditional Middle Eastern yoghurt drink, available sweet or salty.",
    price: "LKR 500",
    img: drinkImg,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
  {
    num: "29",
    name: "Vimto Drink",
    desc: "Classic Vimto fruit cordial drink.",
    price: "LKR 300",
    img: drinkImg,
    tag: null,
    spicy: 0,
    categories: ["all", "add-ons"] as Category[],
  },
];

const SPICY_FLAMES = (count: number) =>
  count > 0
    ? Array.from({ length: count })
        .map(() => "🔥")
        .join("")
    : null;

/* ─── PAGE ─── */
function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = MENU_ITEMS.filter((item) => item.categories.includes(activeCategory));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />

      {/* Page Header */}
      <section className="relative pt-32 pb-16 px-5 lg:px-10 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,59,20,0.18),transparent_60%)]" />
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#ff6a00] opacity-60"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              animation: `ember-rise ${2 + i * 0.4}s ease-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[#ff6a00] text-xs font-bold tracking-[0.35em] uppercase mb-4">
            — Authentic Middle Eastern & Mediterranean Cuisine —
          </p>
          <h1 className="font-display text-white leading-[0.9] uppercase text-[clamp(3rem,12vw,7rem)]">
            <span className="text-[#ff3b14]">HELL'S</span> MENU
          </h1>
          <p className="mt-4 text-white/60 tracking-[0.2em] uppercase text-sm font-semibold">
            Bold Flavours. Real Recipes. 100% Hell's.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="sticky top-[60px] z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5 px-5 lg:px-10 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                data-category={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[#ff3b14] text-white shadow-[0_0_16px_rgba(255,59,20,0.4)]"
                    : "glass-dark text-white/70"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <section id="menu-grid" className="px-5 lg:px-10 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="relative rounded-lg overflow-hidden border border-[#ff3b14] transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(255,59,20,0.4),0_8px_32px_rgba(255,59,20,0.35)]"
              >
                {/* image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {item.tag && (
                    <span className="absolute top-4 left-4 bg-[#ff3b14] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm leading-none">
                      {item.tag}
                    </span>
                  )}
                  {item.likes && (
                    <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-full">
                      👍 {item.likes}
                    </span>
                  )}
                </div>

                {/* content */}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="shrink-0 text-[#ff3b14]/50 font-display text-xl leading-tight mt-0.5">
                      {item.num}
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl tracking-wide text-white uppercase leading-tight">
                      {item.name}
                      {SPICY_FLAMES(item.spicy) && (
                        <span className="ml-2 text-base align-middle">
                          {SPICY_FLAMES(item.spicy)}
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-5">{item.desc}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-block border border-[#ff3b14] text-[#ff3b14] text-lg font-bold px-5 py-2 rounded-lg tracking-wider shadow-[0_0_10px_rgba(255,59,20,0.5),inset_0_0_10px_rgba(255,59,20,0.08)]">
                      {item.price}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom row: Hell's Meal Deal + Add-ons */}
          <div className="mt-6 grid lg:grid-cols-2 gap-5 md:gap-6">
            {/* Meal Deal */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden glass-dark border border-white/8 min-h-[220px] flex items-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(255,59,20,0.25),transparent_60%)]" />
              <div className="relative z-10 flex-1 p-8 md:p-10">
                <p className="text-white font-display text-4xl md:text-5xl uppercase leading-tight tracking-wide mb-3">
                  Make It A
                </p>
                <p className="font-display text-[clamp(3rem,8vw,5rem)] uppercase leading-[0.85] text-[#ff3b14] tracking-wide">
                  HELL'S
                </p>
                <p className="font-display text-4xl md:text-5xl uppercase leading-tight tracking-wide text-white mb-4">
                  MEAL DEAL!
                </p>
                <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
                  Add garlic fries and a drink to make your order absolutely legendary.
                </p>
                <div className="inline-block border border-white/30 rounded-sm px-5 py-3">
                  <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/50 mb-1">
                    Starting From
                  </div>
                  <div className="text-white font-display text-2xl tracking-wide">LKR 590</div>
                </div>
              </div>
              <div className="hidden md:block relative z-10 w-48 shrink-0 pr-6">
                <img
                  src={loadedFries}
                  alt="Hell's Meal Deal"
                  className="w-full rounded-xl object-cover aspect-square opacity-90"
                />
              </div>
            </motion.div>

            {/* Customise tip */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl glass-dark border border-white/8 p-8 flex flex-col justify-center"
            >
              <h3 className="font-display text-3xl md:text-4xl uppercase tracking-wide text-white mb-1">
                Make it <span className="text-[#ff3b14]">YOURS!</span>
              </h3>
              <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-5">
                Customise Your Order
              </p>
              <div className="h-px bg-white/10 mb-6" />
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Add extra sides, dips, and more from our <strong className="text-white">Add-ons</strong> category — fries, hummus, pita, falafels, extra meat, and drinks are all available to build your perfect plate.
              </p>
              <button
                onClick={() => {
                  const el = document.querySelector('[data-category="add-ons"]') as HTMLButtonElement | null;
                  el?.click();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="self-start inline-flex items-center gap-2 bg-[#ff3b14] hover:bg-[#ff5a2a] text-white px-6 py-3 rounded-md font-bold text-xs uppercase tracking-[0.15em] transition"
              >
                <Flame className="w-4 h-4" /> Browse Add-ons
              </button>
            </motion.div>
          </div>
        </div>
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
        <div className="grid md:grid-cols-4 gap-10 mb-14">
          <div className="md:col-span-2">
            <img
              src={logoImage}
              alt="Hell's Shawarma & Grill"
              className="h-16 w-auto object-contain mb-5"
              decoding="async"
            />
            <p className="text-white/60 max-w-md leading-relaxed">
              Authentic Middle Eastern and Mediterranean cuisine — crafted with real spices, proper
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
                  {n.href.startsWith("/") && !n.href.includes("#") ? (
                    <Link
                      to={n.href as "/menu"}
                      className="text-sm text-white/75 hover:text-[#ff6a00] transition"
                    >
                      {n.label}
                    </Link>
                  ) : (
                    <a
                      href={n.href}
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
              <li>Fusion Food Court, 9 Galle Rd,<br />Dehiwala-Mount Lavinia 10350</li>
              <li>072 320 5285</li>
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
