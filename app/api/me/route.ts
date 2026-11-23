import { NextResponse } from "next/server";
import { ApiError, handler, readJson } from "@/lib/server/api";
import {
  clearSessionCookie,
  hashPassword,
  setSessionCookie,
  signSession,
  verifyPassword,
} from "@/lib/server/auth";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { User } from "@/lib/server/models/user";
import { toUser } from "@/lib/server/serialize";
import { updateProfileSchema } from "@/lib/validators";

export const PATCH = handler({ auth: "user" }, async ({ req, user }) => {
  const data = await readJson(req, updateProfileSchema);
  const doc = await User.findById(user.id).select("+passwordHash");
  if (!doc) throw new ApiError(404, "User not found");

  if (data.username) doc.username = data.username;
  let rotated = false;
  if (data.newPassword) {
    if (!(await verifyPassword(data.currentPassword ?? "", doc.passwordHash))) {
      throw new ApiError(400, "Current password is incorrect", {
        currentPassword: "Current password is incorrect",
      });
    }
    doc.passwordHash = await hashPassword(data.newPassword);
    doc.tokenVersion += 1; // signs out every other device
    rotated = true;
  }
  await doc.save();

  const res = NextResponse.json({ user: toUser(doc) });
  if (rotated)
    setSessionCookie(res, await signSession(String(doc._id), doc.tokenVersion));
  return res;
});

export const DELETE = handler({ auth: "user" }, async ({ user }) => {
  // The admin account owns the whole instance. To remove it, delete the database and the hosting.
  if (user.isAdmin) throw new ApiError(403, "The admin account can't be deleted here.");
  await Promise.all([
    Bookmark.deleteMany({ userId: user.id }),
    Group.deleteMany({ userId: user.id }),
  ]);
  await User.deleteOne({ _id: user.id });
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
});
