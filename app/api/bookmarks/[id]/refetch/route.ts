import { ApiError, handler } from "@/lib/server/api";
import { Bookmark } from "@/lib/server/models/bookmark";
import { fetchMetadata, normalizeUrl } from "@/lib/server/metadata";
import { hit } from "@/lib/server/rate-limit";
import { toBookmark } from "@/lib/server/serialize";
import { idSchema } from "@/lib/validators";

export const POST = handler({ auth: "user" }, async ({ user, params }) => {
  await hit(`refetch:${user.id}`, 60, 60_000);
  const id = idSchema.parse(params.id);
  const bookmark = await Bookmark.findOne({ _id: id, userId: user.id }).select(
    "+faviconData +faviconType",
  );
  if (!bookmark) throw new ApiError(404, "Bookmark not found");
  const url = normalizeUrl(bookmark.url);
  if (!url) throw new ApiError(400, "This link is no longer valid");

  const meta = await fetchMetadata(url);
  bookmark.title = meta.title;
  bookmark.description = meta.description;
  bookmark.domain = meta.domain;
  if (meta.favicon) {
    bookmark.faviconData = meta.favicon.data;
    bookmark.faviconType = meta.favicon.type;
    bookmark.faviconVersion = (bookmark.faviconVersion ?? 0) + 1;
  }
  await bookmark.save();
  return { bookmark: toBookmark(bookmark) };
});
