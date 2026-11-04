// Netlify event function: runs automatically after every successful deploy.
// Pings IndexNow (Bing, Yandex, Seznam, Naver...) with blog URLs that changed
// since the last ping, so new and updated posts get crawled within minutes.
// Google doesn't use IndexNow; it picks changes up from sitemap.xml.

import { getMeta, serviceRest, setMeta, SITE_URL } from "./lib/blog-admin.js";

// Must match the key file served at /<key>.txt (public/).
const INDEXNOW_KEY = "72db650273288b872ade85f485866b95";

export const handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || "{}").payload ?? {};
    if (payload.context && payload.context !== "production") {
      return { statusCode: 200, body: "Not a production deploy." };
    }

    const now = new Date().toISOString();
    const since =
      (await getMeta("indexnow_last_ping"))?.at ?? new Date(Date.now() - 24 * 3600e3).toISOString();

    // published_at is checked too: a scheduled post goes live long after its last edit.
    const changed = await serviceRest(
      `blog_posts?select=slug,category:blog_categories(slug)&status=eq.published&published_at=lte.${now}` +
        `&noindex=is.false&canonical_url=is.null` +
        `&or=(updated_at.gt.%22${since}%22,published_at.gt.%22${since}%22)&limit=500`,
    );
    if (!changed?.length) {
      await setMeta("indexnow_last_ping", { at: now, count: 0 });
      return { statusCode: 200, body: "Nothing new to ping." };
    }

    const urls = new Set([`${SITE_URL}/blog`]);
    for (const p of changed) {
      urls.add(`${SITE_URL}/blog/${p.slug}`);
      if (p.category?.slug) urls.add(`${SITE_URL}/blog/category/${p.category.slug}`);
    }

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: [...urls],
      }),
    });
    console.log("deploy-succeeded: IndexNow", res.status, [...urls]);
    await setMeta("indexnow_last_ping", { at: now, count: urls.size, status: res.status });
    return { statusCode: 200, body: `Pinged ${urls.size} URL(s).` };
  } catch (err) {
    console.error("deploy-succeeded: IndexNow ping failed", err);
    return { statusCode: 200, body: "Ping failed (non-fatal)." };
  }
};
