// Light/dark theme for the blog and blog admin ONLY. The rest of the site is
// always dark: the theme attribute is only ever set while a /blog or /admin
// page is showing, and every themed colour falls back to the dark value.

import { useCallback, useEffect, useState } from "react";

export type BlogTheme = "light" | "dark";

const STORAGE_KEY = "hs-blog-theme";
const ATTR = "data-blog-theme";
const EVENT = "hs-blog-theme";
const THEMED_PATH = /^\/(blog|admin)(\/|$)/;

// Runs in <head> before first paint so prerendered pages never flash the wrong theme.
// No saved choice -> follow the device setting.
export const themeBootScript = `(function(){try{if(!${THEMED_PATH}.test(location.pathname))return;var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("${ATTR}",t)}catch(e){}})();`;

function savedTheme(): BlogTheme | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function systemTheme(): BlogTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function setThemeAttr(t: BlogTheme) {
  document.documentElement.setAttribute(ATTR, t);
  window.dispatchEvent(new CustomEvent<BlogTheme>(EVENT, { detail: t }));
}

/**
 * Use once in the blog and admin layouts: applies the theme while they are
 * mounted (covers client-side navigation from the always-dark pages) and
 * removes it again when leaving.
 */
export function useApplyBlogTheme() {
  useEffect(() => {
    setThemeAttr(savedTheme() ?? systemTheme());
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      if (!savedTheme()) setThemeAttr(systemTheme());
    };
    media.addEventListener("change", onSystemChange);
    return () => {
      media.removeEventListener("change", onSystemChange);
      document.documentElement.removeAttribute(ATTR);
    };
  }, []);
}

/** Current theme + toggle, for components that render differently per theme. */
export function useBlogTheme() {
  const [theme, setTheme] = useState<BlogTheme>("dark");

  useEffect(() => {
    if (document.documentElement.getAttribute(ATTR) === "light") setTheme("light");
    const onChange = (e: Event) => setTheme((e as CustomEvent<BlogTheme>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: BlogTheme =
      document.documentElement.getAttribute(ATTR) === "light" ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode: still switches for this page view
    }
    setThemeAttr(next);
  }, []);

  return { theme, toggle };
}
