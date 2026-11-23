import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { hasAnyUser } from "@/lib/server/pages";

export const metadata: Metadata = { title: "Sign up" };

// Open only until the first account exists. After that the page redirects to /login.
export default async function RegisterPage() {
  if (await hasAnyUser()) redirect("/login");
  return <RegisterForm />;
}
