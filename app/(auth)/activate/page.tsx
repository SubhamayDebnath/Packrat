import type { Metadata } from "next";
import Link from "next/link";
import { ActivateForm } from "@/components/auth/activate-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { sha256 } from "@/lib/server/auth";
import { connectDB } from "@/lib/server/db";
import { User } from "@/lib/server/models/user";

export const metadata: Metadata = { title: "Activate account" };

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let user: { username: string; email: string } | null = null;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    await connectDB();
    user = await User.findOne({
      activationTokenHash: sha256(token),
      activationExpires: { $gt: new Date() },
      status: "pending",
    })
      .select("username email")
      .lean();
  }

  if (!token || !user) {
    return (
      <AuthShell
        title="This link doesn't work"
        description="It is invalid, expired, or already used. Ask your admin for a new activation link."
      >
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </AuthShell>
    );
  }
  return <ActivateForm token={token} username={user.username} email={user.email} />;
}
