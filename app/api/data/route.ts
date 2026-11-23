import { handler } from "@/lib/server/api";
import { ensureDefaultGroup, getHomeData } from "@/lib/server/data";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";

export const GET = handler({ auth: "user" }, async ({ user }) => getHomeData(user.id));

// Deletes every group and bookmark of the signed-in user, and nobody else's.
// The account stays, and an empty private "Bookmarks" group is recreated so the app keeps working.
export const DELETE = handler({ auth: "user" }, async ({ user }) => {
  await Promise.all([
    Bookmark.deleteMany({ userId: user.id }),
    Group.deleteMany({ userId: user.id }),
  ]);
  await ensureDefaultGroup(user.id);
  return { ok: true };
});
