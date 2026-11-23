import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Favicon } from "@/components/bookmarks/favicon";
import { GroupDot } from "@/components/bookmarks/group-dot";
import { Logo } from "@/components/layout/logo";
import { connectDB } from "@/lib/server/db";
import { Bookmark } from "@/lib/server/models/bookmark";
import { Group } from "@/lib/server/models/group";
import { User } from "@/lib/server/models/user";
import { toBookmark } from "@/lib/server/serialize";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shared group",
  robots: { index: false, follow: false },
};

export default async function SharedGroupPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(shareId)) notFound();
  await connectDB();
  const group = await Group.findOne({ shareId, isPublic: true }).lean();
  if (!group) notFound();
  const [owner, items] = await Promise.all([
    User.findById(group.userId).select("username").lean(),
    Bookmark.find({ groupId: group._id }).sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  return (
    <>
      <header className="w-full">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-24">
        <div className="flex items-center gap-2">
          <GroupDot color={group.color} />
          <h1 className="text-base font-semibold">{group.name}</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Shared by {owner?.username ?? "someone"} · {items.length} link
          {items.length === 1 ? "" : "s"}
        </p>
        <ul className="mt-8 flex flex-col">
          {items.map((raw) => {
            const b = toBookmark(raw);
            return (
              <li
                key={b.id}
                className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <Favicon bookmark={b} />
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-baseline gap-2 outline-none after:absolute after:inset-0 after:content-['']"
                >
                  <span className="truncate font-medium">{b.title}</span>
                  <span className="hidden truncate text-muted-foreground min-[400px]:inline">
                    {b.domain}
                  </span>
                </a>
                <span
                  suppressHydrationWarning
                  className="hidden shrink-0 text-muted-foreground tabular-nums sm:block"
                >
                  {formatDate(b.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
