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
import { registerFormSchema } from "@/lib/validators";

export function RegisterForm() {
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { shakeKey, shake } = useShake();
  const set = (key: keyof typeof values) => (v: string) =>
    setValues((s) => ({ ...s, [key]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      return shake();
    }
    setErrors({});
    setBusy(true);
    try {
      const { username, email, password } = parsed.data;
      await api("/auth/register", {
        method: "POST",
        body: { username, email, password },
      });
      toast.success("Welcome to Packrat", {
        description: "Your admin account is ready.",
      });
      window.location.replace("/");
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else
        toast.error(
          err instanceof ApiClientError
            ? err.message
            : "Something went wrong. Try again.",
        );
      if (err instanceof ApiClientError && err.status === 403)
        window.location.replace("/login");
      shake();
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Sign up"
      description="Create the admin account to get started"
      footer="This is the only sign-up. After it, you add everyone else from Settings."
    >
      <motion.form
        key={shakeKey}
        onSubmit={submit}
        noValidate
        className="grid gap-5"
        animate={shakeKey ? { x: [0, -9, 9, -6, 6, -2, 0] } : undefined}
        transition={{ duration: 0.4 }}
      >
        <Field id="username" label="Username" error={errors.username}>
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            placeholder="ephraim"
            maxLength={32}
            value={values.username}
            aria-invalid={!!errors.username}
            onChange={(e) => set("username")(e.target.value)}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            aria-invalid={!!errors.email}
            onChange={(e) => set("email")(e.target.value)}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <PasswordField
            id="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set("password")}
            aria-invalid={!!errors.password}
          />
        </Field>
        <Field id="confirm" label="Confirm Password" error={errors.confirm}>
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            value={values.confirm}
            onChange={set("confirm")}
            aria-invalid={!!errors.confirm}
          />
        </Field>
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <Button type="submit" disabled={busy} className="w-full">
            {busy && <Loader2 className="animate-spin" />}
            Sign up
          </Button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
