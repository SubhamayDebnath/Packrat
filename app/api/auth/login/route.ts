import { NextResponse } from "next/server";
import { ApiError, clientIp, handler, readJson } from "@/lib/server/api";
import {
  getDummyHash,
  setSessionCookie,
  signSession,
  verifyPassword,
} from "@/lib/server/auth";
import { hit, reset } from "@/lib/server/rate-limit";
import { User } from "@/lib/server/models/user";
import { toUser } from "@/lib/server/serialize";
import { loginSchema } from "@/lib/validators";

export const POST = handler({ auth: "none" }, async ({ req }) => {
  const { email, password } = await readJson(req, loginSchema);
  const ip = clientIp(req);
  const accountKey = `login:${ip}:${email}`;
  await hit(`login-ip:${ip}`, 40, 15 * 60_000);
  await hit(accountKey, 8, 15 * 60_000);

  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? (await getDummyHash()),
  );
  if (!user || !valid) throw new ApiError(401, "Incorrect email or password");
  if (user.status !== "active") {
    throw new ApiError(
      403,
      "Your account is not active yet. Open the activation link your admin sent you.",
    );
  }

  await reset(accountKey);
  user.lastLoginAt = new Date();
  await user.save();

  const res = NextResponse.json({ user: toUser(user) });
  setSessionCookie(res, await signSession(String(user._id), user.tokenVersion));
  return res;
});
