import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import logoImage from "@/assets/logo2.png";
import { ThemeToggle } from "@/components/blog/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyMembership } from "@/lib/blog/admin-api";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const sb = getSupabase();
      if (mode === "reset") {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        });
        if (error) throw error;
        toast.success("If that email belongs to a team member, a reset link is on its way.");
        setMode("login");
        return;
      }
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const member = await getMyMembership();
      if (!member || member.disabled) {
        await sb.auth.signOut();
        throw new Error(
          member?.disabled
            ? "This account has been disabled. Contact an admin."
            : "This account doesn't have blog access.",
        );
      }
      if (member.must_change_password) {
        navigate({ to: "/admin/set-password", replace: true });
        return;
      }
      // Only follow same-app admin paths to avoid open redirects.
      const target = redirect?.startsWith("/admin") ? redirect : "/admin";
      navigate({ href: target, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
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
          {mode === "login" ? "Blog admin" : "Reset your password"}
        </h1>
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode === "login" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Send reset link"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "reset" : "login")}
            className="block w-full text-center text-sm text-blog-fg/55 hover:text-blog-fg"
          >
            {mode === "login" ? "Forgot password?" : "Back to sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
