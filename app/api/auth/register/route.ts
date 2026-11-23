import { NextResponse } from "next/server";
import { ApiError, clientIp, handler, readJson } from "@/lib/server/api";
import { hashPassword, setSessionCookie, signSession } from "@/lib/server/auth";
import { ensureDefaultGroup } from "@/lib/server/data";
import { hit } from "@/lib/server/rate-limit";
import { User } from "@/lib/server/models/user";
import { toUser } from "@/lib/server/serialize";
import { registerSchema } from "@/lib/validators";

const CLOSED = "Sign-up is closed. Ask your admin to create an account for you.";

// Only works while the database has zero users. The first account becomes the admin.
export const POST = handler({ auth: "none" }, async ({ req }) => {
  await hit(`register:${clientIp(req)}`, 5, 15 * 60_000);
  const data = await readJson(req, registerSchema);

  await User.init(); // make sure the one-admin unique index exists before racing inserts
  if ((await User.estimatedDocumentCount()) > 0) throw new ApiError(403, CLOSED);

  let user;
  try {
    user = await User.create({
      username: data.username,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      isAdmin: true,
      status: "active",
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new ApiError(403, CLOSED);
    throw error;
  }
  await ensureDefaultGroup(user._id);

  const res = NextResponse.json({ user: toUser(user) });
  setSessionCookie(res, await signSession(String(user._id), user.tokenVersion));
  return res;
});
