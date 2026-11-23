import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/server/auth";
import { hasAnyUser } from "@/lib/server/pages";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");
  if (!(await hasAnyUser())) redirect("/register");
  return <LoginForm />;
}
