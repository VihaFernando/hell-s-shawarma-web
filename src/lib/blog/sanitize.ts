// One HTML sanitizer for blog content, used when saving (admin), when fetching
// posts for render, and at prerender time. isomorphic-dompurify runs the same
// DOMPurify config in the browser and in Node, so output is identical everywhere.

import DOMPurify from "isomorphic-dompurify";

// Hosts blog posts may embed. Anything else is removed.
const IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.google.com", // Maps embeds
  "www.instagram.com",
  "www.tiktok.com",
]);

let hooked = false;
function installHooks() {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "IFRAME") {
      let ok = false;
      try {
        const u = new URL(node.getAttribute("src") ?? "");
        ok = u.protocol === "https:" && IFRAME_HOSTS.has(u.hostname);
      } catch {
        // invalid src: removed below
      }
      if (!ok) node.parentNode?.removeChild(node);
      return;
    }
    // target=_blank without noopener lets the opened page script window.opener.
    if (node.nodeName === "A" && node.getAttribute("target")) {
      const rel = new Set((node.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      node.setAttribute("rel", [...rel].join(" "));
    }
  });
}

export function sanitizeHtml(html: string) {
  installHooks();
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "loading", "target", "srcset", "sizes"],
    FORBID_TAGS: ["style", "script", "form", "input", "button"],
    FORBID_ATTR: ["style"],
  });
}
