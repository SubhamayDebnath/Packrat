import type { Bookmark, Group } from "@/types";

export const PAGE_SIZE = 10;

/** Without a query: the current group. With a query: every group, each word matching title, link or group name. */
export function filterBookmarks(
  bookmarks: Bookmark[],
  groups: Group[],
  currentGroupId: string,
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return bookmarks.filter((b) => b.groupId === currentGroupId);
  const names = new Map(groups.map((g) => [g.id, g.name]));
  const terms = q.split(/\s+/);
  return bookmarks.filter((b) => {
    const haystack = `${b.title} ${b.url} ${names.get(b.groupId) ?? ""}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

export const pageCount = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));
export const clampPage = (page: number, total: number) =>
  Math.min(Math.max(1, page), pageCount(total));
export const pageSlice = <T>(items: T[], page: number) =>
  items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
