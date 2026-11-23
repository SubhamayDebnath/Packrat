import { ApiError, handler, readJson } from "@/lib/server/api";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { toBookmark } from "@/lib/server/serialize";
import { idSchema, updateBookmarkSchema } from "@/lib/validators";

export const PATCH = handler({ auth: "user" }, async ({ req, user, params }) => {
  const id = idSchema.parse(params.id);
  const data = await readJson(req, updateBookmarkSchema);
  if (data.groupId && !(await Group.exists({ _id: data.groupId, userId: user.id }))) {
    throw new ApiError(404, "Group not found");
  }
  const res = await Bookmark.updateOne({ _id: id, userId: user.id }, data);
  if (!res.matchedCount) throw new ApiError(404, "Bookmark not found");
  const bookmark = await Bookmark.findById(id).lean();
  if (!bookmark) throw new ApiError(404, "Bookmark not found");
  return { bookmark: toBookmark(bookmark) };
});

export const DELETE = handler({ auth: "user" }, async ({ user, params }) => {
  const id = idSchema.parse(params.id);
  const res = await Bookmark.deleteOne({ _id: id, userId: user.id });
  if (!res.deletedCount) throw new ApiError(404, "Bookmark not found");
  return { ok: true };
});
