import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PermissionPicker } from "@/components/admin/PermissionPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  inviteMember,
  listMembers,
  removeMember,
  resetMemberPassword,
  updateMember,
  type InviteResult,
} from "@/lib/blog/admin-api";
import { can, presetFor, ROLE_PRESETS, type Member, type Permission } from "@/lib/blog/permissions";

export const Route = createFileRoute("/admin/_panel/team")({
  beforeLoad: ({ context }) => {
    if (!can(context.member, "users.manage")) throw redirect({ to: "/admin" });
  },
  component: TeamPage,
});

const KEY = ["admin-team"];
const dialogClass =
  "max-h-[90vh] overflow-y-auto border-blog-fg/10 bg-blog-surface text-blog-fg sm:max-w-xl";

function memberStatus(m: Member) {
  if (m.disabled)
    return { label: "Disabled", cls: "bg-red-500/15 text-red-300 light:text-red-700" };
  if (m.must_change_password && m.invite_expired)
    return { label: "Invite expired", cls: "bg-red-500/15 text-red-300 light:text-red-700" };
  if (m.must_change_password)
    return { label: "Invited", cls: "bg-amber-400/15 text-amber-300 light:text-amber-700" };
  return { label: "Active", cls: "bg-emerald-400/15 text-emerald-300 light:text-emerald-700" };
}

function TeamPage() {
  const { member: me } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: members, isLoading, error } = useQuery({ queryKey: KEY, queryFn: listMembers });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    member: Member;
    invite: InviteResult;
    reset: boolean;
  } | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  async function run<T>(fn: () => Promise<T>, success?: string) {
    try {
      const out = await fn();
      if (success) toast.success(success);
      refresh();
      return out;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      return undefined;
    }
  }

  async function reset(m: Member) {
    const out = await run(() => resetMemberPassword(m.user_id));
    if (out) setInviteResult({ ...out, reset: true });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-blog-fg/55">
            Invite people to write for the blog and choose exactly what they can do.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite member
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-blog-fg/10">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-blog-fg/50" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-400 light:text-red-700">{(error as Error).message}</p>
        ) : (
          <ul className="divide-y divide-blog-fg/10">
            {members?.map((m) => {
              const status = memberStatus(m);
              const isMe = m.user_id === me.user_id;
              return (
                <li key={m.user_id} className="flex items-center gap-4 bg-blog-surface px-4 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff3b14]/15 text-sm font-bold uppercase text-blog-link">
                    {(m.display_name || m.email).slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {m.display_name || m.email}
                      {isMe && (
                        <span className="ml-2 text-xs font-normal text-blog-fg/45">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-blog-fg/45">
                      {m.email} · {presetFor(m.permissions)}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-blog-fg/50 sm:block">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}
                    >
                      {status.label}
                    </span>
                    <p className="mt-1">
                      {m.last_sign_in_at
                        ? `Last seen ${formatDistanceToNow(new Date(m.last_sign_in_at), { addSuffix: true })}`
                        : "Never signed in"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={`Actions for ${m.email}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onSelect={() => setEditing(m)}>
                        <Pencil className="h-4 w-4" /> Edit name & permissions
                      </DropdownMenuItem>
                      {!isMe && (
                        <>
                          <DropdownMenuItem onSelect={() => reset(m)}>
                            {m.must_change_password ? (
                              <>
                                <Mail className="h-4 w-4" /> Resend invite
                              </>
                            ) : (
                              <>
                                <KeyRound className="h-4 w-4" /> Reset password
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              run(
                                () => updateMember(m.user_id, { disabled: !m.disabled }),
                                m.disabled ? "Access restored." : "Access disabled.",
                              )
                            }
                          >
                            {m.disabled ? (
                              <>
                                <RotateCcw className="h-4 w-4" /> Enable access
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" /> Disable access
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setRemoving(m)}
                            className="text-red-400 light:text-red-700 focus:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" /> Remove from team
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(result) => {
          setInviteOpen(false);
          setInviteResult({ ...result, reset: false });
          refresh();
        }}
      />

      {editing && (
        <EditDialog
          member={editing}
          isMe={editing.user_id === me.user_id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      <InviteResultDialog result={inviteResult} onClose={() => setInviteResult(null)} />

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>Remove {removing?.display_name || removing?.email}?</DialogTitle>
            <DialogDescription>
              Their login is deleted and they lose access immediately. Posts they wrote stay on the
              blog. To keep the account but block access temporarily, use “Disable access” instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const m = removing!;
                setRemoving(null);
                await run(() => removeMember(m.user_id), "Member removed.");
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteDialog({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: (r: { member: Member; invite: InviteResult }) => void;
}) {
  const author = ROLE_PRESETS.find((r) => r.id === "author")!.permissions;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(author);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const result = await inviteMember({ email, display_name: name, permissions });
      setEmail("");
      setName("");
      setPermissions(author);
      onInvited(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They'll get a sign-in link and a temporary password, and must choose their own password
            on first sign-in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shown as the post author"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !email || permissions.length === 0}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  member,
  isMe,
  onClose,
  onSaved,
}: {
  member: Member;
  isMe: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(member.display_name);
  const [permissions, setPermissions] = useState<Permission[]>(member.permissions);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateMember(member.user_id, { display_name: name, permissions });
      toast.success("Member updated.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>Edit {member.display_name || member.email}</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <PermissionPicker
            value={permissions}
            onChange={setPermissions}
            lockedOn={isMe ? ["users.manage"] : []}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || permissions.length === 0}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteResultDialog({
  result,
  onClose,
}: {
  result: { member: Member; invite: InviteResult; reset: boolean } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  const { member, invite, reset } = result;

  async function copy() {
    await navigator.clipboard.writeText(invite.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>{reset ? "New temporary password created" : "Invite created"}</DialogTitle>
          <DialogDescription>
            {invite.emailed
              ? `We emailed the sign-in link and temporary password to ${member.email}.`
              : invite.emailConfigured
                ? `The email to ${member.email} couldn't be sent. Share the message below with them instead.`
                : `Email sending isn't set up yet, so share this message with ${member.email} yourself (WhatsApp, etc.).`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-blog-fg/10 bg-black/40 p-3">
            <p className="text-xs uppercase tracking-wider text-blog-fg/45">Temporary password</p>
            <p className="mt-1 select-all font-mono text-lg tracking-wide">{invite.tempPassword}</p>
          </div>
          <Textarea readOnly rows={9} value={invite.message} className="font-mono text-xs" />
          <p className="text-xs text-blog-fg/45">
            This password is shown only once and expires in 7 days. They'll be asked to choose their
            own password when they sign in.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy message"}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
