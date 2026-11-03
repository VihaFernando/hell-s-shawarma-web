import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileText, FolderTree, Images, LogOut, Users } from "lucide-react";

import logoImage from "@/assets/logo2.png";
import { DeployStatus } from "@/components/admin/DeployStatus";
import { ThemeToggle } from "@/components/blog/ThemeToggle";
import { getMyMembership } from "@/lib/blog/admin-api";
import { can } from "@/lib/blog/permissions";
import { getSupabase } from "@/lib/supabase";

// Pathless layout guarding every admin page except login / set-password / reset-password.
export const Route = createFileRoute("/admin/_panel")({
  beforeLoad: async ({ location }) => {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    const member = data.session ? await getMyMembership().catch(() => null) : null;
    if (!data.session || !member || member.disabled) {
      if (data.session) await sb.auth.signOut();
      throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    }
    // Invited members must replace their temporary password before anything else.
    if (member.must_change_password) throw redirect({ to: "/admin/set-password" });
    return { user: data.session.user, member };
  },
  component: AdminPanel,
});

const navItem =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-blog-fg/70 hover:bg-blog-fg/5 hover:text-blog-fg data-[status=active]:bg-[#ff3b14]/15 data-[status=active]:font-semibold data-[status=active]:text-blog-accent";
const mobileItem = "data-[status=active]:text-blog-accent";

function AdminPanel() {
  const { user, member } = Route.useRouteContext();
  const navigate = useNavigate();

  async function signOut() {
    await getSupabase().auth.signOut();
    navigate({ to: "/admin/login", search: { redirect: undefined } });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col self-start overflow-y-auto border-r border-blog-fg/10 bg-blog-surface p-4 md:sticky md:top-0 md:flex md:h-screen">
        <Link to="/admin" className="px-2 py-3">
          <img src={logoImage} alt="Hell's Shawarma" className="h-9 w-auto" />
        </Link>
        <p className="mt-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-blog-fg/40">
          Blog
        </p>
        <nav className="mt-2 space-y-1">
          <Link to="/admin" activeOptions={{ exact: true }} className={navItem}>
            <FileText className="h-4 w-4" /> Posts
          </Link>
          <Link to="/admin/assets" className={navItem}>
            <Images className="h-4 w-4" /> Asset library
          </Link>
          {can(member, "categories.manage") && (
            <Link to="/admin/categories" className={navItem}>
              <FolderTree className="h-4 w-4" /> Categories
            </Link>
          )}
          {can(member, "users.manage") && (
            <Link to="/admin/team" className={navItem}>
              <Users className="h-4 w-4" /> Team
            </Link>
          )}
          <a href="/blog" target="_blank" rel="noopener" className={navItem}>
            <ExternalLink className="h-4 w-4" /> View blog
          </a>
        </nav>
        <div className="mt-auto border-t border-blog-fg/10 pt-4">
          {member.display_name && (
            <p className="truncate px-3 text-sm font-semibold">{member.display_name}</p>
          )}
          <p className="truncate px-3 text-xs text-blog-fg/45">{user.email}</p>
          <button type="button" onClick={signOut} className={`${navItem} mt-1 w-full`}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-blog-fg/10 px-5 py-3 md:px-8">
          <nav className="flex gap-4 text-sm md:hidden">
            <Link to="/admin" activeOptions={{ exact: true }} className={mobileItem}>
              Posts
            </Link>
            <Link to="/admin/assets" className={mobileItem}>
              Assets
            </Link>
            {can(member, "categories.manage") && (
              <Link to="/admin/categories" className={mobileItem}>
                Categories
              </Link>
            )}
            {can(member, "users.manage") && (
              <Link to="/admin/team" className={mobileItem}>
                Team
              </Link>
            )}
            <button type="button" onClick={signOut} className="text-blog-fg/60">
              Sign out
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <DeployStatus
              canRebuild={can(member, "site.rebuild") || can(member, "posts.publish")}
            />
            <ThemeToggle className="h-9 w-9" />
          </div>
        </header>
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
