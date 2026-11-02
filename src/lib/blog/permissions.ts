// Team permissions. Must match the check constraint in
// supabase/migrations/0002_blog_members.sql and ALL_PERMISSIONS in
// netlify/functions/lib/blog-admin.js. The database (RLS) and the server
// functions enforce these; the UI only uses them to hide what you can't do.

export const PERMISSIONS = [
  {
    id: "posts.create",
    label: "Write posts",
    description: "Create drafts and edit their own drafts.",
  },
  {
    id: "posts.edit_all",
    label: "Edit everyone's posts",
    description: "Edit drafts written by other team members.",
  },
  {
    id: "posts.publish",
    label: "Publish",
    description: "Publish, schedule and unpublish posts, and edit live posts.",
  },
  { id: "posts.delete", label: "Delete posts", description: "Permanently delete posts." },
  {
    id: "categories.manage",
    label: "Manage categories",
    description: "Create, rename and delete blog categories.",
  },
  {
    id: "site.rebuild",
    label: "Rebuild site",
    description: "Manually trigger a website rebuild.",
  },
  {
    id: "users.manage",
    label: "Manage team",
    description: "Invite people, change permissions, reset passwords and remove members.",
  },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["id"];

export const ROLE_PRESETS: {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
}[] = [
  {
    id: "admin",
    label: "Admin",
    description: "Full access, including team management.",
    permissions: PERMISSIONS.map((p) => p.id),
  },
  {
    id: "editor",
    label: "Editor",
    description: "Writes, edits and publishes any post. No team management.",
    permissions: [
      "posts.create",
      "posts.edit_all",
      "posts.publish",
      "posts.delete",
      "categories.manage",
      "site.rebuild",
    ],
  },
  {
    id: "author",
    label: "Author",
    description: "Writes drafts for an editor to review and publish.",
    permissions: ["posts.create"],
  },
];

export function presetFor(perms: readonly string[]) {
  const set = [...perms].sort().join(",");
  return ROLE_PRESETS.find((r) => [...r.permissions].sort().join(",") === set)?.label ?? "Custom";
}

export type Member = {
  user_id: string;
  email: string;
  display_name: string;
  permissions: Permission[];
  disabled: boolean;
  must_change_password: boolean;
  invited_by: string | null;
  invited_at: string | null;
  password_changed_at: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  invite_expired?: boolean;
};

export const can = (member: Pick<Member, "permissions"> | null | undefined, perm: Permission) =>
  !!member?.permissions.includes(perm);
