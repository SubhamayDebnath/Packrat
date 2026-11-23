"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { BookmarkRow } from "@/components/bookmarks/bookmark-row";
import { EmptyState } from "@/components/bookmarks/empty-state";
import { Pagination } from "@/components/bookmarks/pagination";
import { filterBookmarks, pageCount, pageSlice } from "@/lib/visible";
import { useApp } from "@/stores/app-store";

export function BookmarkList() {
  const bookmarks = useApp((s) => s.bookmarks);
  const groups = useApp((s) => s.groups);
  const currentId = useApp((s) => s.currentGroupId);
  const query = useApp((s) => s.query);
  const page = useApp((s) => s.page);
  const setPage = useApp((s) => s.setPage);

  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const filtered = useMemo(
    () => filterBookmarks(bookmarks, groups, currentId, query),
    [bookmarks, groups, currentId, query],
  );
  const pages = pageCount(filtered.length);
  const current = Math.min(page, pages);

  // Deleting the last item on a page, or opening a stale ?page= URL, lands on the nearest real page.
  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current, setPage]);

  if (!filtered.length) return <EmptyState query={query.trim()} />;

  return (
    <section aria-label="Bookmarks" className="mt-4">
      <ul className="flex flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {pageSlice(filtered, current).map((b) => (
            <BookmarkRow
              key={b.id}
              bookmark={b}
              group={groupById.get(b.groupId)}
              showGroup={!!query.trim()}
            />
          ))}
        </AnimatePresence>
      </ul>
      {pages > 1 && <Pagination page={current} pages={pages} onChange={setPage} />}
    </section>
  );
}
