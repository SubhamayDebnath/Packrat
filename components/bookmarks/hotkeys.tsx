"use client";

import { useCallback } from "react";
import { isTyping, useKeydown } from "@/hooks/use-hotkeys";
import { copyText, useBookmarkActions } from "@/hooks/use-bookmark-actions";
import { useAppApi } from "@/stores/app-store";
import { useUi } from "@/stores/ui";

/** Renders nothing. Registers the app-wide keyboard shortcuts. */
export function Hotkeys() {
  const store = useAppApi();
  const actions = useBookmarkActions();
  const openAddLink = useUi((s) => s.openAddLink);
  const setShortcutsOpen = useUi((s) => s.setShortcutsOpen);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const overlayOpen = !!document.querySelector(
        '[role="dialog"],[role="alertdialog"],[role="menu"]',
      );
      const state = store.getState();

      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
        return;
      }
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!overlayOpen) openAddLink();
        return;
      }
      if (overlayOpen) return;

      if (e.key === "Escape" && state.selectMode) {
        state.clearSelection();
        return;
      }
      if (isTyping(e.target)) return;
      if (e.key === "?" && !mod) {
        setShortcutsOpen(true);
        return;
      }

      // Row shortcuts act on whichever row the pointer or keyboard focus is on.
      const bookmark = state.bookmarks.find((b) => b.id === state.activeId);
      if (!mod || !bookmark) return;
      const key = e.key.toLowerCase();
      if (key === "c" && !window.getSelection()?.toString()) {
        e.preventDefault();
        copyText(bookmark.url, "Link copied");
      } else if (key === "enter") {
        e.preventDefault();
        window.open(bookmark.url, "_blank", "noopener,noreferrer");
      } else if (key === "e") {
        e.preventDefault();
        actions.rename(bookmark);
      } else if (key === "backspace" || key === "delete") {
        e.preventDefault();
        actions.remove(bookmark);
      }
    },
    [store, actions, openAddLink, setShortcutsOpen],
  );

  useKeydown(onKeyDown);
  return null;
}
