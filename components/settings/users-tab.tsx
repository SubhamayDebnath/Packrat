"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
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
import { PasswordField } from "@/components/auth/password-field";
import { UserAvatar } from "@/components/layout/user-avatar";
import { copyText } from "@/hooks/use-bookmark-actions";
import { api, ApiClientError } from "@/lib/api-client";
import { createUserSchema, passwordSchema } from "@/lib/validators";
import { useApp } from "@/stores/app-store";
import { useUi } from "@/stores/ui";
import type { User } from "@/types";

type Invite = { user: User; activationUrl: string; password: string };

export function UsersTab() {
  const me = useApp((s) => s.user);
  const askConfirm = useUi((s) => s.askConfirm);
  const [users, setUsers] = useState<User[] | null>(null);
  const [resetFor, setResetFor] = useState<User | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ users: User[] }>("/users")
      .then((r) => alive && setUsers(r.users))
      .catch((e) =>
        toast.error(e instanceof ApiClientError ? e.message : "Could not load users"),
      );
    return () => {
      alive = false;
    };
  }, []);

  async function resendLink(u: User) {
    try {
      const r = await api<{ activationUrl: string }>(`/users/${u.id}`, {
        method: "PATCH",
        body: { action: "resend-activation" },
      });
      await copyText(r.activationUrl, "New activation link copied");
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : "Could not create a link");
    }
  }

  function removeUser(u: User) {
    askConfirm({
      title: `Delete ${u.username}?`,
      description: "Their account, groups and bookmarks are removed permanently.",
      actionLabel: "Delete user",
      destructive: true,
      onConfirm: async () => {
        try {
          await api(`/users/${u.id}`, { method: "DELETE" });
          setUsers((list) => list?.filter((x) => x.id !== u.id) ?? null);
          toast.success("User deleted");
        } catch (e) {
          toast.error(e instanceof ApiClientError ? e.message : "Could not delete user");
        }
      },
    });
  }

  return (
    <div className="grid gap-6">
      <AddUserForm onAdded={(u) => setUsers((list) => [...(list ?? []), u])} />

      <div className="grid gap-2">
        <Label>People</Label>
        {users === null ? (
          <div className="grid gap-2" aria-label="Loading users">
            {[0, 1].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-1">
            <AnimatePresence initial={false}>
              {users.map((u) => (
                <motion.li
                  key={u.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
                >
                  <UserAvatar name={u.username} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {u.username}
                      {u.id === me.id && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          you
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs " +
                      (u.isAdmin
                        ? "bg-foreground text-background"
                        : u.status === "pending"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    {u.isAdmin ? "Admin" : u.status === "pending" ? "Pending" : "Active"}
                  </span>
                  {!u.isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${u.username}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {u.status === "pending" && (
                          <DropdownMenuItem onSelect={() => resendLink(u)}>
                            <RefreshCw /> New activation link
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => setResetFor(u)}>
                          <KeyRound /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => removeUser(u)}
                        >
                          <Trash2 /> Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ResetPasswordDialog user={resetFor} onClose={() => setResetFor(null)} />
    </div>
  );
}

function AddUserForm({ onAdded }: { onAdded: (u: User) => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createUserSchema.safeParse({ username, email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      return setErrors(next);
    }
    setErrors({});
    setBusy(true);
    try {
      const r = await api<{ user: User; activationUrl: string }>("/users", {
        method: "POST",
        body: parsed.data,
      });
      onAdded(r.user);
      setInvite({ ...r, password: parsed.data.password });
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else
        toast.error(
          err instanceof ApiClientError
            ? err.message
            : "Something went wrong. Try again.",
        );
    } finally {
      setBusy(false);
    }
  }

  const message = invite
    ? `Hi ${invite.user.username}, your Packrat account is ready.\n\nActivate it: ${invite.activationUrl}\nEmail: ${invite.user.email}\nTemporary password: ${invite.password}`
    : "";

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-4 rounded-xl border p-4" noValidate>
        <div className="flex items-center gap-2 font-medium">
          <UserPlus className="size-4" /> Add a person
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="new-username">Username</Label>
            <Input
              id="new-username"
              value={username}
              maxLength={32}
              autoComplete="off"
              aria-invalid={!!errors.username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-email">Email</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              autoComplete="off"
              aria-invalid={!!errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-user-password">Password</Label>
          <PasswordField
            id="new-user-password"
            generate
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            aria-invalid={!!errors.password}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Type one, or use the dice to generate a strong password.
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            Add user
          </Button>
        </div>
      </form>

      <AnimatePresence initial={false}>
        {invite && (
          <motion.div
            key="invite"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="grid gap-3 rounded-xl border border-green-500/40 bg-green-500/5 p-4">
              <p className="flex items-center gap-2 font-medium">
                <Check className="size-4 text-green-600 dark:text-green-400" />
                {invite.user.username} was added
              </p>
              <p className="text-xs text-muted-foreground">
                Share the activation link and password with them yourself. They must open
                the link before they can sign in.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={invite.activationUrl}
                  aria-label="Activation link"
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copy activation link"
                  onClick={() => copyText(invite.activationUrl, "Activation link copied")}
                >
                  <Copy />
                </Button>
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(message, "Invite message copied")}
                >
                  <Copy /> Copy invite message
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInvite(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: { action: "reset-password", password },
      });
      await copyText(
        password,
        `Password reset for ${user.username}. Copied to clipboard`,
      );
      setPassword("");
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!user}
      onOpenChange={(o) => {
        if (!o) {
          setPassword("");
          setError("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {user?.username}. They are signed out everywhere and
              must use this one next.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reset-password">New password</Label>
            <PasswordField
              id="reset-password"
              generate
              autoFocus
              autoComplete="new-password"
              value={password}
              aria-invalid={!!error}
              onChange={(v) => {
                setPassword(v);
                setError("");
              }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
