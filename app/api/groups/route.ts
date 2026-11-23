import { ApiError, handler, readJson } from "@/lib/server/api";
import { Group } from "@/lib/server/models/group";
import { toGroup } from "@/lib/server/serialize";
import { escapeRegex } from "@/lib/server/util";
import { newShareId } from "@/lib/server/data";
import { createGroupSchema } from "@/lib/validators";

export const POST = handler({ auth: "user" }, async ({ req, user }) => {
  const data = await readJson(req, createGroupSchema);
  if ((await Group.countDocuments({ userId: user.id })) >= 50)
    throw new ApiError(400, "You can have up to 50 groups");
  const clash = await Group.exists({
    userId: user.id,
    name: new RegExp(`^${escapeRegex(data.name)}$`, "i"),
  });
  if (clash)
    throw new ApiError(409, "You already have a group with that name", {
      name: "That name is taken",
    });
  const { isPublic = false, ...fields } = data;
  const group = await Group.create({
    userId: user.id,
    ...fields,
    isPublic,
    ...(isPublic ? { shareId: newShareId() } : {}),
  });
  return { group: toGroup(group) };
});
