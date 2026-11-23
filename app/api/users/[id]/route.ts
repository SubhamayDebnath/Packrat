import { ApiError, handler, origin, readJson } from "@/lib/server/api";
import { ACTIVATION_TTL_MS } from "@/lib/constants";
import { hashPassword, newActivationToken } from "@/lib/server/auth";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { User } from "@/lib/server/models/user";
import { idSchema, updateUserSchema } from "@/lib/validators";

export const PATCH = handler({ auth: "admin" }, async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  const data = await readJson(req, updateUserSchema);
  const target = await User.findById(id).select(
    "+passwordHash +activationTokenHash +activationExpires",
  );
  if (!target) throw new ApiError(404, "User not found");
  if (target.isAdmin && String(target._id) !== user.id)
    throw new ApiError(403, "You cannot change another admin");

  if (data.action === "reset-password") {
    target.passwordHash = await hashPassword(data.password);
    target.tokenVersion += 1; // forces sign-out everywhere
    await target.save();
    return { ok: true };
  }

  if (target.status !== "pending")
    throw new ApiError(400, "This account is already active");
  const { token, hash } = newActivationToken();
  target.activationTokenHash = hash;
  target.activationExpires = new Date(Date.now() + ACTIVATION_TTL_MS);
  await target.save();
  const activationUrl = `${origin(req)}/activate?token=${token}`;
  return { activationUrl };
});

export const DELETE = handler({ auth: "admin" }, async ({ user, params }) => {
  const id = idSchema.parse(params.id);
  if (id === user.id) throw new ApiError(400, "You cannot delete your own account");
  const target = await User.findById(id);
  if (!target) throw new ApiError(404, "User not found");
  if (target.isAdmin) throw new ApiError(403, "The admin account cannot be deleted");
  await Promise.all([
    Bookmark.deleteMany({ userId: id }),
    Group.deleteMany({ userId: id }),
  ]);
  await target.deleteOne();
  return { ok: true };
});
