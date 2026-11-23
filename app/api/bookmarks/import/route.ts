import { ApiError, handler, readJson } from "@/lib/server/api";
import { GROUP_COLORS } from "@/lib/constants";
import { ensureDefaultGroup } from "@/lib/server/data";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { normalizeUrl } from "@/lib/server/metadata";
import { escapeRegex } from "@/lib/server/util";
import { importSchema } from "@/lib/validators";

const MAX_IMPORT = 2000;
const MAX_BOOKMARKS = 5000;

export const POST = handler({ auth: "user" }, async ({ req, user }) => {
  const data = await readJson(req, importSchema);
  await ensureDefaultGroup(user.id);

  const existing = await Bookmark.countDocuments({ userId: user.id });
  if (existing >= MAX_BOOKMARKS)
    throw new ApiError(400, `You can save up to ${MAX_BOOKMARKS} bookmarks`);

  let groupCount = await Group.countDocuments({ userId: user.id });
  const docs: Record<string, unknown>[] = [];
  let skipped = 0;
  let groupsCreated = 0;

  for (const entry of data.groups) {
    if (docs.length >= MAX_IMPORT || existing + docs.length >= MAX_BOOKMARKS) break;
    let group =
      entry.name === ""
        ? await Group.findOne({ userId: user.id, isDefault: true })
        : await Group.findOne({
            userId: user.id,
            name: new RegExp(`^${escapeRegex(entry.name)}$`, "i"),
          });
    if (!group) {
      if (groupCount >= 50)
        group = await Group.findOne({ userId: user.id, isDefault: true });
      else {
        group = await Group.create({
          userId: user.id,
          name: entry.name,
          color: GROUP_COLORS[(groupCount + 1) % GROUP_COLORS.length],
        });
        groupCount++;
        groupsCreated++;
      }
    }
    if (!group) continue;

    const known = new Set(
      (await Bookmark.find({ groupId: group._id }).select("url").lean()).map(
        (b) => b.url,
      ),
    );
    for (const link of entry.links) {
      if (docs.length >= MAX_IMPORT || existing + docs.length >= MAX_BOOKMARKS) break;
      const url = normalizeUrl(link.url);
      if (!url || known.has(url.toString())) {
        skipped++;
        continue;
      }
      known.add(url.toString());
      const domain = url.hostname.replace(/^www\./, "");
      docs.push({
        userId: user.id,
        groupId: group._id,
        url: url.toString(),
        title: (link.title || domain).slice(0, 200),
        domain,
      });
    }
  }

  if (docs.length) await Bookmark.insertMany(docs, { ordered: false });
  return { imported: docs.length, skipped, groups: groupsCreated };
});
