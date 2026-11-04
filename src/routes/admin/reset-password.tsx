import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/blog/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // supabase-js picks up the recovery token from the URL and starts a session.
  useEffect(() => {
    const sb = getSupabase();
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    sb.auth.getSession().then(({ data: s }) => s.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10) {
      toast.error("Use at least 10 characters.");
      return;
    }
    setBusy(true);
    const { error } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-5">
      <ThemeToggle className="absolute right-5 top-5" />
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-blog-fg/10 bg-blog-surface p-8"
      >
        <h1 className="text-xl font-bold">Choose a new password</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-blog-fg/60">
            Checking your reset link… If nothing happens, request a new link from the sign-in page.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
