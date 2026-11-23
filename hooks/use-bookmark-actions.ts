"use client";

import { toast } from "sonner";
import { useAppApi } from "@/stores/app-store";
import { useUi } from "@/stores/ui";
import type { Bookmark } from "@/types";

export async function copyText(text: string, success: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error("Could not copy. Your browser blocked clipboard access.");
  }
}

/** Every bookmark action lives here, so the context menu, the mobile menu and keyboard shortcuts behave identically. */
export function useBookmarkActions() {
  const store = useAppApi();
  const askConfirm = useUi((s) => s.askConfirm);

  return {
    copy: (b: Bookmark) => copyText(b.url, "Link copied"),
    rename: (b: Bookmark) => store.getState().setRenaming(b.id),
    refetch: (b: Bookmark) => store.getState().refetchBookmark(b.id),
    move: (b: Bookmark, groupId: string) =>
      store.getState().moveBookmarks([b.id], groupId),
    select: (b: Bookmark) => store.getState().enterSelect(b.id),
    remove: (b: Bookmark) =>
      askConfirm({
        title: "Delete this bookmark?",
        description: `“${b.title}” will be removed permanently.`,
        actionLabel: "Delete",
        destructive: true,
        onConfirm: () => store.getState().deleteBookmarks([b.id]),
      }),
    removeMany: (ids: string[]) =>
      askConfirm({
        title: `Delete ${ids.length} bookmark${ids.length === 1 ? "" : "s"}?`,
        description: "They will be removed permanently.",
        actionLabel: "Delete",
        destructive: true,
        onConfirm: () => store.getState().deleteBookmarks(ids),
      }),
  };
}
