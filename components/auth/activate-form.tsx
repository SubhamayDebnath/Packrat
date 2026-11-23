"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/auth/field";
import { PasswordField } from "@/components/auth/password-field";
import { api, ApiClientError } from "@/lib/api-client";
import { passwordSchema } from "@/lib/validators";

export function ActivateForm({
  token,
  username,
  email,
}: {
  token: string;
  username: string;
  email: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password) {
      const parsed = passwordSchema.safeParse(password);
      if (!parsed.success) return setError(parsed.error.issues[0].message);
    }
    setBusy(true);
    try {
      await api("/auth/activate", {
        method: "POST",
        body: { token, password: password || undefined },
      });
      toast.success("Account activated", { description: "You can sign in now." });
      window.location.replace("/login");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Activate your account"
      description={`Hi ${username}. Activating ${email} lets you sign in.`}
    >
      <form onSubmit={submit} noValidate className="grid gap-5">
        <Field id="password" label="New password (optional)" error={error}>
          <PasswordField
            id="password"
            autoComplete="new-password"
            placeholder="Keep the one your admin gave you"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError("");
            }}
            aria-invalid={!!error}
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" />}
          Activate account
        </Button>
      </form>
    </AuthShell>
  );
}
