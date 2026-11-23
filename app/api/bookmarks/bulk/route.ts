import { ApiError, handler, readJson } from "@/lib/server/api";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { bulkSchema } from "@/lib/validators";

export const POST = handler({ auth: "user" }, async ({ req, user }) => {
  const data = await readJson(req, bulkSchema);
  const filter = { _id: { $in: data.ids }, userId: user.id };
  if (data.action === "delete") {
    const res = await Bookmark.deleteMany(filter);
    return { count: res.deletedCount };
  }
  if (!(await Group.exists({ _id: data.groupId, userId: user.id })))
    throw new ApiError(404, "Group not found");
  const res = await Bookmark.updateMany(filter, { groupId: data.groupId });
  return { count: res.modifiedCount };
});
