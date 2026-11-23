"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import { DataSection } from "@/components/settings/data-section";
import { UserAvatar } from "@/components/layout/user-avatar";
import { api, ApiClientError } from "@/lib/api-client";
import { passwordSchema, usernameSchema } from "@/lib/validators";
import { useApp } from "@/stores/app-store";
import { useUi } from "@/stores/ui";
import type { User } from "@/types";

export function GeneralTab() {
  const user = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const setOpen = useUi((s) => s.setSettingsOpen);

  const [username, setUsername] = useState(user.username);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = usernameSchema.safeParse(username);
    if (!name.success) next.username = name.error.issues[0].message;
    if (showPassword && newPassword) {
      const pw = passwordSchema.safeParse(newPassword);
      if (!pw.success) next.newPassword = pw.error.issues[0].message;
      if (!currentPassword) next.currentPassword = "Enter your current password";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const body: Record<string, string> = {};
    if (username.trim() !== user.username) body.username = username.trim();
    if (showPassword && newPassword)
      Object.assign(body, { currentPassword, newPassword });
    if (!Object.keys(body).length) return setOpen(false);

    setBusy(true);
    try {
      const res = await api<{ user: User }>("/me", { method: "PATCH", body });
      setUser(res.user);
      toast.success(body.newPassword ? "Password changed" : "Settings saved");
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else
        toast.error(
          err instanceof ApiClientError
            ? err.message
            : "Something went wrong. Try again.",
        );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5" noValidate>
      <div className="flex items-center gap-3">
        <UserAvatar name={user.username} className="size-12 text-lg" />
        <div className="min-w-0">
          <p className="truncate font-medium">{user.username}</p>
          <p className="text-xs text-muted-foreground">
            {user.isAdmin ? "Admin" : "Member"}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="settings-username">Username</Label>
        <Input
          id="settings-username"
          value={username}
          maxLength={32}
          aria-invalid={!!errors.username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="settings-email">Email</Label>
        <Input id="settings-email" value={user.email} disabled readOnly />
      </div>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2.5 w-fit"
          onClick={() => setShowPassword((v) => !v)}
          aria-expanded={showPassword}
        >
          Change password
          <motion.span
            animate={{ rotate: showPassword ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <ChevronDown className="size-4 text-muted-foreground" />
          </motion.span>
        </Button>
        <AnimatePresence initial={false}>
          {showPassword && (
            <motion.div
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <div className="grid gap-4 p-0.5">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <PasswordField
                    id="current-password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    aria-invalid={!!errors.currentPassword}
                  />
                  {errors.currentPassword && (
                    <p className="text-xs text-destructive">{errors.currentPassword}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordField
                    id="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    aria-invalid={!!errors.newPassword}
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-destructive">{errors.newPassword}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DataSection />

      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
