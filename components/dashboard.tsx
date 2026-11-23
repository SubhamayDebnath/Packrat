"use client";

import { Navbar } from "@/components/layout/navbar";
import { SearchBar } from "@/components/bookmarks/search-bar";
import { BookmarkList } from "@/components/bookmarks/bookmark-list";
import { SelectionBar } from "@/components/bookmarks/selection-bar";
import { Hotkeys } from "@/components/bookmarks/hotkeys";
import { AddLinkDialog } from "@/components/dialogs/add-link-dialog";
import { ConfirmHost } from "@/components/dialogs/confirm-host";
import { GroupDialog } from "@/components/dialogs/group-dialog";
import { ShortcutsDialog } from "@/components/dialogs/shortcuts-dialog";
import { SettingsDialog } from "@/components/settings/settings-dialog";

export function Dashboard() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 pt-6 pb-40">
        <SearchBar />
        <BookmarkList />
      </main>
      <SelectionBar />
      <Hotkeys />
      <AddLinkDialog />
      <GroupDialog />
      <SettingsDialog />
      <ShortcutsDialog />
      <ConfirmHost />
    </>
  );
}
