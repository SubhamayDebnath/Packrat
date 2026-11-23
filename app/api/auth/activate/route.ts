import { ApiError, clientIp, handler, readJson } from "@/lib/server/api";
import { hashPassword, sha256 } from "@/lib/server/auth";
import { ensureDefaultGroup } from "@/lib/server/data";
import { hit } from "@/lib/server/rate-limit";
import { User } from "@/lib/server/models/user";
import { activateSchema } from "@/lib/validators";

export const POST = handler({ auth: "none" }, async ({ req }) => {
  await hit(`activate:${clientIp(req)}`, 10, 15 * 60_000);
  const { token, password } = await readJson(req, activateSchema);

  const user = await User.findOne({
    activationTokenHash: sha256(token),
    activationExpires: { $gt: new Date() },
    status: "pending",
  }).select("+activationTokenHash +activationExpires +passwordHash");
  if (!user)
    throw new ApiError(
      400,
      "This activation link is invalid or has expired. Ask your admin for a new one.",
    );

  if (password) user.passwordHash = await hashPassword(password);
  user.status = "active";
  user.activationTokenHash = undefined;
  user.activationExpires = undefined;
  await user.save();
  await ensureDefaultGroup(user._id);
  return { ok: true };
});
