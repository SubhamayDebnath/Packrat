import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";

// Optimistic gate only: it rejects missing or forged tokens before rendering.
// The real check (user still exists, is active, token version matches) runs in getSessionUser().
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      // fall through to redirect
    }
  }
  const res = NextResponse.redirect(new URL("/login", request.url));
  if (token) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = { matcher: ["/"] };
