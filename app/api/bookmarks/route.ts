import { ApiError, handler, readJson } from "@/lib/server/api";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { fetchMetadataCached, normalizeUrl } from "@/lib/server/metadata";
import { toBookmark } from "@/lib/server/serialize";
import { hit } from "@/lib/server/rate-limit";
import { createBookmarkSchema } from "@/lib/validators";

const MAX_BOOKMARKS = 5000;

export const POST = handler({ auth: "user" }, async ({ req, user }) => {
  await hit(`add:${user.id}`, 60, 60_000);
  const data = await readJson(req, createBookmarkSchema);
  const url = normalizeUrl(data.url);
  if (!url) throw new ApiError(400, "Enter a valid link", { url: "Enter a valid link" });

  if (!(await Group.exists({ _id: data.groupId, userId: user.id })))
    throw new ApiError(404, "Group not found");
  if ((await Bookmark.countDocuments({ userId: user.id })) >= MAX_BOOKMARKS) {
    throw new ApiError(400, `You can save up to ${MAX_BOOKMARKS} bookmarks`);
  }
  if (
    await Bookmark.exists({ userId: user.id, groupId: data.groupId, url: url.toString() })
  ) {
    throw new ApiError(409, "That link is already saved in this group", {
      url: "Already saved in this group",
    });
  }

  const meta = await fetchMetadataCached(url);
  const bookmark = await Bookmark.create({
    userId: user.id,
    groupId: data.groupId,
    url: meta.url,
    title: data.title || meta.title,
    description: meta.description,
    domain: meta.domain,
    ...(meta.favicon
      ? {
          faviconData: meta.favicon.data,
          faviconType: meta.favicon.type,
          faviconVersion: 1,
        }
      : {}),
  });
  return { bookmark: toBookmark(bookmark) };
});
