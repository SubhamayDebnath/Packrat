"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shortcut } from "@/components/ui/shortcut";
import { useUi } from "@/stores/ui";

export function ShortcutsDialog() {
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);

  const rows: [string, string[]][] = [
    ["Search bookmarks", ["mod", "F"]],
    ["Add a link", ["mod", "K"]],
    ["Open the link under the cursor", ["mod", "enter"]],
    ["Copy the link under the cursor", ["mod", "C"]],
    ["Rename the bookmark under the cursor", ["mod", "E"]],
    ["Delete the bookmark under the cursor", ["mod", "backspace"]],
    ["Leave multi-select", ["Esc"]],
    ["Show this list", ["?"]],
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Row shortcuts work on the bookmark your pointer or focus is on.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2.5">
          {rows.map(([label, keys]) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span>{label}</span>
              <Shortcut keys={keys} className="shrink-0" />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
