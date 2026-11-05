import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import logoImage from "@/assets/logo2.webp";
import { ThemeToggle } from "@/components/blog/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyMembership, setInitialPassword, signInWithPassword } from "@/lib/blog/admin-api";
import { getSupabase } from "@/lib/supabase";

// First sign-in after an invite (or an admin password reset): the member must
// replace the temporary password before they can use the admin.
export const Route = createFileRoute("/admin/set-password")({
  beforeLoad: async () => {
    // Dynamic imports keep supabase-js out of the public (blog/site) bundle.
    const [{ getSupabase }, { getMyMembership }] = await Promise.all([
      import("@/lib/supabase"),
      import("@/lib/blog/admin-api"),
    ]);
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login", search: { redirect: undefined } });
    const member = await getMyMembership().catch(() => null);
    if (!member || member.disabled) {
      await getSupabase().auth.signOut();
      throw redirect({ to: "/admin/login", search: { redirect: undefined } });
    }
    if (!member.must_change_password) throw redirect({ to: "/admin" });
    return { member, email: data.session.user.email ?? member.email };
  },
  component: SetPasswordPage,
});

const RULES = [
  { label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  {
    label: "Three of: lowercase, uppercase, number, symbol",
    test: (p: string) =>
      [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(p)).length >= 3,
  },
];

function SetPasswordPage() {
  const { member, email } = Route.useRouteContext();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const valid = RULES.every((r) => r.test(password));
  const matches = password.length > 0 && password === confirm;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid || !matches) return;
    setBusy(true);
    try {
      await setInitialPassword(password);
      // Start a fresh session with the new password.
      const sb = getSupabase();
      await sb.auth.signOut();
      await signInWithPassword(email, password);
      toast.success("Password set. Welcome to the team!");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't set your password");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    await getSupabase().auth.signOut();
    navigate({ to: "/admin/login", search: { redirect: undefined }, replace: true });
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-5">
      <ThemeToggle className="absolute right-5 top-5" />
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-blog-fg/10 bg-blog-surface p-8 shadow-2xl"
      >
        <img src={logoImage} alt="Hell's Shawarma" className="mx-auto h-12 w-auto" />
        <h1 className="mt-6 text-center text-xl font-bold">
          Welcome{member.display_name ? `, ${member.display_name}` : ""}!
        </h1>
        <p className="mt-2 text-center text-sm text-blog-fg/60">
          Choose your own password to replace the temporary one.
        </p>
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blog-fg/50 hover:text-blog-fg"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <li
                    key={r.label}
                    className={`flex items-center gap-1.5 ${ok ? "text-emerald-400 light:text-emerald-700" : "text-blog-fg/50"}`}
                  >
                    {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}{" "}
                    {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm && !matches && (
              <p className="text-xs text-red-400 light:text-red-700">Passwords don't match.</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={busy || !valid || !matches}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Set password and continue
          </Button>
          <button
            type="button"
            onClick={cancel}
            className="block w-full text-center text-sm text-blog-fg/55 hover:text-blog-fg"
          >
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
}
