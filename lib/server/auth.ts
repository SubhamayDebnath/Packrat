import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";
import { env } from "./env";
import { connectDB } from "./db";
import { User } from "./models/user";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  status: "active" | "pending";
  createdAt: Date;
};

const key = () => new TextEncoder().encode(env.jwtSecret);

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

// Compared against when the email is unknown, so response time does not reveal which emails exist.
let dummyHash: Promise<string> | undefined;
export const getDummyHash = () =>
  (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

export function newActivationToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: sha256(token) };
}
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function signSession(userId: string, tokenVersion: number) {
  return new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Verifies the JWT and re-checks the user in the database, so deleted or deactivated users lose access at once. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    await connectDB();
    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== "active" || user.tokenVersion !== payload.tv)
      return null;
    return {
      id: String(user._id),
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      status: user.status,
      createdAt: (user as unknown as { createdAt: Date }).createdAt,
    };
  } catch {
    return null;
  }
}
