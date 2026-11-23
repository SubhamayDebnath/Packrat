import { NextResponse } from "next/server";
import { handler } from "@/lib/server/api";
import { clearSessionCookie } from "@/lib/server/auth";

export const POST = handler({ auth: "none" }, async () => {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
});
