// Admin-side data access: authenticated Supabase writes (RLS enforces each
// member's permissions) and calls to the blog Netlify Functions.

import { getSupabase } from "@/lib/supabase";

import type { Member, Permission } from "./permissions";
import type { BlogCategory, BlogPost } from "./types";

export type AdminPostRow = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "status"
  | "published_at"
  | "updated_at"
  | "cover_image_url"
  | "noindex"
  | "focus_keyword"
  | "created_by"
> & { category: { name: string } | null };

export type PostInput = Omit<BlogPost, "id" | "created_at" | "updated_at" | "created_by">;

function unwrap<T>({
  data,
  error,
}: {
  data: T | null;
  error: { message: string; code?: string } | null;
}) {
  if (error) {
    if (error.code === "23505") throw new Error("That slug is already used by another post.");
    throw new Error(error.message);
  }
  return data as T;
}

/** The signed-in user's team membership (null if they aren't on the team). */
export async function getMyMembership() {
  const { data } = await getSupabase().auth.getUser();
  if (!data.user) return null;
  const res = await getSupabase()
    .from("blog_members")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return unwrap(res) as Member | null;
}

/** Display names for the team, used to show post authors. */
export async function listTeamNames() {
  const res = await getSupabase().from("blog_members").select("user_id,email,display_name");
  return unwrap(res) as Pick<Member, "user_id" | "email" | "display_name">[];
}

export async function listAdminPosts() {
  const res = await getSupabase()
    .from("blog_posts")
    .select(
      "id,slug,title,status,published_at,updated_at,cover_image_url,noindex,focus_keyword,created_by,category:blog_categories(name)",
    )
    .order("updated_at", { ascending: false });
  return unwrap(res) as unknown as AdminPostRow[];
}

export async function getAdminPost(id: string) {
  const res = await getSupabase().from("blog_posts").select("*").eq("id", id).single();
  return unwrap(res) as BlogPost;
}

export async function savePost(id: string | null, input: Partial<PostInput>) {
  const sb = getSupabase();
  const res = id
    ? await sb.from("blog_posts").update(input).eq("id", id).select("*").single()
    : await sb.from("blog_posts").insert(input).select("*").single();
  return unwrap(res) as BlogPost;
}

export async function deletePost(id: string) {
  unwrap(await getSupabase().from("blog_posts").delete().eq("id", id));
}

export async function listAdminCategories() {
  const res = await getSupabase().from("blog_categories").select("*").order("sort_order");
  return unwrap(res) as BlogCategory[];
}

export async function saveCategory(id: string | null, input: Partial<BlogCategory>) {
  const sb = getSupabase();
  const res = id
    ? await sb.from("blog_categories").update(input).eq("id", id).select("*").single()
    : await sb.from("blog_categories").insert(input).select("*").single();
  return unwrap(res) as BlogCategory;
}

export async function deleteCategory(id: string) {
  unwrap(await getSupabase().from("blog_categories").delete().eq("id", id));
}

export async function slugTaken(slug: string, exceptId: string | null) {
  let q = getSupabase().from("blog_posts").select("id").eq("slug", slug).limit(1);
  if (exceptId) q = q.neq("id", exceptId);
  return (unwrap(await q) as { id: string }[]).length > 0;
}

// ------------------------------------------------------------ Netlify Functions

async function callFunction<T>(name: string, init: RequestInit = {}): Promise<T> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session expired. Please sign in again.");
  let res: Response;
  try {
    res = await fetch(`/api/${name}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new Error("Couldn't reach the server functions.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.error ??
        (res.status === 404
          ? "Server functions aren't available here (run `npx netlify dev` locally)."
          : `Request failed (${res.status}).`),
    );
  }
  return body as T;
}

export function requestRebuild(reason: string) {
  return callFunction<{ ok: true; triggeredAt: string }>("blog-rebuild", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export type DeployStatus = {
  available: boolean;
  lastTrigger: { at: string; reason: string } | null;
  deploy?: {
    state: string;
    title: string | null;
    createdAt: string;
    publishedAt: string | null;
    errorMessage: string | null;
    deployTime: number | null;
  } | null;
};

export function getDeployStatus() {
  return callFunction<DeployStatus>("blog-deploy-status");
}

export function getUploadSignature() {
  return callFunction<{ uploadUrl: string; fields: Record<string, string | number> }>(
    "blog-upload-signature",
    { method: "POST", body: "{}" },
  );
}

// ------------------------------------------------------------ Asset library

export type BlogAsset = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  createdAt: string;
  usedBy: { id: string; title: string }[];
  isNew: boolean;
};

export function listAssets(cursor: string | null) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return callFunction<{ assets: BlogAsset[]; nextCursor: string | null }>(`blog-assets${query}`);
}

export function deleteAsset(publicId: string) {
  return callFunction<{ ok: true }>("blog-assets", {
    method: "POST",
    body: JSON.stringify({ public_id: publicId }),
  });
}

// ------------------------------------------------------------ Team management

export type InviteResult = {
  emailed: boolean;
  emailConfigured: boolean;
  tempPassword: string;
  message: string;
};

export async function listMembers() {
  return (await callFunction<{ members: Member[] }>("blog-users")).members;
}

export function inviteMember(input: {
  email: string;
  display_name: string;
  permissions: Permission[];
}) {
  return callFunction<{ member: Member; invite: InviteResult }>("blog-users", {
    method: "POST",
    body: JSON.stringify({ action: "invite", ...input }),
  });
}

export function resetMemberPassword(userId: string) {
  return callFunction<{ member: Member; invite: InviteResult }>("blog-users", {
    method: "POST",
    body: JSON.stringify({ action: "reset", user_id: userId }),
  });
}

export function updateMember(
  userId: string,
  patch: Partial<Pick<Member, "display_name" | "permissions" | "disabled">>,
) {
  return callFunction<{ member: Member }>("blog-users", {
    method: "PATCH",
    body: JSON.stringify({ user_id: userId, ...patch }),
  });
}

export function removeMember(userId: string) {
  return callFunction<{ ok: true }>(`blog-users?user_id=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

/** First sign-in: swap the temporary password for the member's own. */
export function setInitialPassword(password: string) {
  return callFunction<{ ok: true }>("blog-account", {
    method: "POST",
    body: JSON.stringify({ action: "set-password", password }),
  });
}
