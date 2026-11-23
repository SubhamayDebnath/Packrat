"use client";

import { useMemo } from "react";
import { Copy, FileDown, ListChecks, ListX, MoveRight, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupDot } from "@/components/bookmarks/group-dot";
import { copyText, useBookmarkActions } from "@/hooks/use-bookmark-actions";
import { buildNetscape, downloadFile } from "@/lib/netscape";
import { filterBookmarks, pageCount, pageSlice } from "@/lib/visible";
import { useApp, useAppApi } from "@/stores/app-store";

function Divider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />;
}

const label = "hidden sm:inline";

export function SelectionBar() {
  const store = useAppApi();
  const selectMode = useApp((s) => s.selectMode);
  const selected = useApp((s) => s.selected);
  const groups = useApp((s) => s.groups);
  const actions = useBookmarkActions();

  const bookmarks = useApp((s) => s.bookmarks);
  const currentGroupId = useApp((s) => s.currentGroupId);
  const query = useApp((s) => s.query);
  const page = useApp((s) => s.page);

  // "Select all" covers what is on screen: the current page of the current list.
  const pageIds = useMemo(() => {
    const list = filterBookmarks(bookmarks, groups, currentGroupId, query);
    return pageSlice(list, Math.min(page, pageCount(list.length))).map((b) => b.id);
  }, [bookmarks, groups, currentGroupId, query, page]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const chosen = () => {
    const s = store.getState();
    return s.bookmarks.filter((b) => s.selected.includes(b.id));
  };

  return (
    <AnimatePresence>
      {selectMode && (
        <motion.div
          role="toolbar"
          aria-label="Selection actions"
          className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-0.5 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/5"
          initial={{ y: 90, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 90, opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              allSelected
                ? store.getState().deselectAll()
                : store.getState().selectAll(pageIds)
            }
            aria-label={allSelected ? "Deselect all" : "Select all"}
          >
            {allSelected ? <ListX /> : <ListChecks />}
            <span className={label}>{allSelected ? "Deselect All" : "Select All"}</span>
          </Button>
          <Divider />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!selected.length}
                aria-label="Move selected"
              >
                <MoveRight />
                <span className={label}>Move</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" className="w-52">
              {groups.map((g) => (
                <DropdownMenuItem
                  key={g.id}
                  className="gap-2.5"
                  onSelect={() => {
                    store.getState().moveBookmarks(selected, g.id);
                    store.getState().clearSelection();
                  }}
                >
                  <GroupDot color={g.color} />
                  <span className="truncate">{g.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            disabled={!selected.length}
            aria-label="Copy URLs"
            onClick={() =>
              copyText(
                chosen()
                  .map((b) => b.url)
                  .join("\n"),
                `Copied ${selected.length} link${selected.length === 1 ? "" : "s"}`,
              )
            }
          >
            <Copy />
            <span className={label}>Copy URLs</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!selected.length}
            aria-label="Export selected"
            onClick={() =>
              downloadFile("packrat-selection.html", buildNetscape(groups, chosen()))
            }
          >
            <FileDown />
            <span className={label}>Export</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!selected.length}
            aria-label="Delete selected"
            onClick={() => actions.removeMany(selected)}
          >
            <Trash2 />
            <span className={label}>Delete</span>
          </Button>
          <Divider />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Exit selection"
            onClick={() => store.getState().clearSelection()}
          >
            <X />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
