"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/auth/field";
import { PasswordField } from "@/components/auth/password-field";
import { useShake } from "@/components/auth/use-form-shake";
import { api, ApiClientError } from "@/lib/api-client";
import { loginSchema } from "@/lib/validators";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { shakeKey, shake } = useShake();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      return shake();
    }
    setErrors({});
    setBusy(true);
    try {
      await api("/auth/login", { method: "POST", body: parsed.data });
      window.location.replace("/"); // full load: never reuse a cached signed-out redirect
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Something went wrong. Try again.";
      setErrors({ form: message });
      toast.error(message);
      shake();
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Login"
      description="Enter your email below to login to your account"
      footer="Accounts are created by your admin."
    >
      <motion.form
        key={shakeKey}
        onSubmit={submit}
        noValidate
        className="grid gap-5"
        animate={shakeKey ? { x: [0, -9, 9, -6, 6, -2, 0] } : undefined}
        transition={{ duration: 0.4 }}
      >
        <Field id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            aria-invalid={!!errors.email || !!errors.form}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password ?? errors.form}>
          <PasswordField
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            aria-invalid={!!errors.password || !!errors.form}
          />
        </Field>
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <Button type="submit" disabled={busy} className="w-full">
            {busy && <Loader2 className="animate-spin" />}
            Login
          </Button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
