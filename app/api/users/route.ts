import { ApiError, handler, origin, readJson } from "@/lib/server/api";
import { ACTIVATION_TTL_MS } from "@/lib/constants";
import { hashPassword, newActivationToken } from "@/lib/server/auth";
import { ensureDefaultGroup } from "@/lib/server/data";
import { User } from "@/lib/server/models/user";
import { toUser } from "@/lib/server/serialize";
import { createUserSchema } from "@/lib/validators";

export const GET = handler({ auth: "admin" }, async () => {
  const users = await User.find().sort({ createdAt: 1 }).lean();
  return { users: users.map((u) => toUser(u as never)) };
});

export const POST = handler({ auth: "admin" }, async ({ req }) => {
  const data = await readJson(req, createUserSchema);
  if (await User.exists({ email: data.email })) {
    throw new ApiError(409, "That email already has an account", {
      email: "That email already has an account",
    });
  }
  const { token, hash } = newActivationToken();
  const user = await User.create({
    username: data.username,
    email: data.email,
    passwordHash: await hashPassword(data.password),
    status: "pending",
    activationTokenHash: hash,
    activationExpires: new Date(Date.now() + ACTIVATION_TTL_MS),
  });
  await ensureDefaultGroup(user._id);

  const activationUrl = `${origin(req)}/activate?token=${token}`;
  return { user: toUser(user), activationUrl };
});
