import { Types } from "mongoose";
import { randomBytes } from "node:crypto";
import { connectDB } from "./db";
import { Group } from "./models/group";
import { Bookmark } from "./models/bookmark";
import { toBookmark, toGroup } from "./serialize";
import { DEFAULT_GROUP_COLOR, DEFAULT_GROUP_NAME } from "@/lib/constants";

export const newShareId = () => randomBytes(12).toString("base64url");

export async function ensureDefaultGroup(userId: string | Types.ObjectId) {
  await connectDB();
  try {
    await Group.updateOne(
      { userId, isDefault: true },
      {
        $setOnInsert: {
          userId,
          name: DEFAULT_GROUP_NAME,
          color: DEFAULT_GROUP_COLOR,
          isDefault: true,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    // A concurrent request created it first: the unique index makes that harmless.
    if ((error as { code?: number }).code !== 11000) throw error;
  }
}

export async function getHomeData(userId: string) {
  await ensureDefaultGroup(userId);
  const [groups, bookmarks] = await Promise.all([
    Group.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean(),
    Bookmark.find({ userId }).sort({ createdAt: -1 }).limit(5000).lean(),
  ]);
  return { groups: groups.map(toGroup), bookmarks: bookmarks.map(toBookmark) };
}
