// Browser Supabase client for the admin area only (auth + writes). Public blog
// pages use the lightweight REST helpers in lib/blog/api.ts instead, so
// supabase-js never ships in the public bundle.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabase() {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!url || !key) throw new Error("Supabase env vars are not configured.");
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "hs-blog-admin" },
    });
  }
  return client;
}
