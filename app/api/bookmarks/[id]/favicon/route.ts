import { NextResponse } from "next/server";
import { ApiError, handler } from "@/lib/server/api";
import { getSessionUser } from "@/lib/server/auth";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { idSchema } from "@/lib/validators";

// Served from our own origin so the page never talks to third-party hosts (CSP: img-src 'self').
export const GET = handler({ auth: "none" }, async ({ params }) => {
  const id = idSchema.parse(params.id);
  const bookmark = await Bookmark.findById(id)
    .select("+faviconData +faviconType userId groupId")
    .lean();
  if (!bookmark?.faviconData) throw new ApiError(404, "Not found");

  const session = await getSessionUser();
  const isOwner = session?.id === String(bookmark.userId);
  if (!isOwner && !(await Group.exists({ _id: bookmark.groupId, isPublic: true }))) {
    throw new ApiError(404, "Not found");
  }

  // `.lean()` hands back a BSON Binary, not a Buffer.
  const raw = bookmark.faviconData as unknown as { buffer?: Uint8Array } | Uint8Array;
  const bytes = raw instanceof Uint8Array ? raw : (raw.buffer ?? new Uint8Array());

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": bookmark.faviconType ?? "image/x-icon",
      "Cache-Control": isOwner
        ? "private, max-age=604800, immutable"
        : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
