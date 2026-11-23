import { ApiError, handler, readJson } from "@/lib/server/api";
import { newShareId } from "@/lib/server/data";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { toGroup } from "@/lib/server/serialize";
import { escapeRegex } from "@/lib/server/util";
import { idSchema, updateGroupSchema } from "@/lib/validators";

export const PATCH = handler({ auth: "user" }, async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  const data = await readJson(req, updateGroupSchema);
  const group = await Group.findOne({ _id: id, userId: user.id });
  if (!group) throw new ApiError(404, "Group not found");

  if (data.name && data.name !== group.name) {
    if (group.isDefault) throw new ApiError(400, "The default group cannot be renamed");
    const clash = await Group.exists({
      userId: user.id,
      _id: { $ne: id },
      name: new RegExp(`^${escapeRegex(data.name)}$`, "i"),
    });
    if (clash)
      throw new ApiError(409, "You already have a group with that name", {
        name: "That name is taken",
      });
    group.name = data.name;
  }
  if (data.color) group.color = data.color;
  if (data.isPublic !== undefined && data.isPublic !== group.isPublic) {
    group.isPublic = data.isPublic;
    // A fresh id on every share means an old link stops working once you make the group private.
    group.shareId = data.isPublic ? newShareId() : undefined;
  }
  await group.save();
  return { group: toGroup(group) };
});

// Deleting a group deletes every bookmark inside it.
export const DELETE = handler({ auth: "user" }, async ({ user, params }) => {
  const id = idSchema.parse(params.id);
  const group = await Group.findOne({ _id: id, userId: user.id });
  if (!group) throw new ApiError(404, "Group not found");
  if (group.isDefault) throw new ApiError(400, "The default group cannot be deleted");
  await Bookmark.deleteMany({ userId: user.id, groupId: id });
  await group.deleteOne();
  const fallback = await Group.findOne({ userId: user.id, isDefault: true })
    .select("_id")
    .lean();
  if (!fallback) throw new ApiError(500, "Default group is missing");
  return { fallbackId: String(fallback._id) };
});
