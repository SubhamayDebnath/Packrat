"use client";

import { memo, useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Shortcut } from "@/components/ui/shortcut";
import { Favicon } from "@/components/bookmarks/favicon";
import { GroupDot } from "@/components/bookmarks/group-dot";
import {
  BookmarkMenuItems,
  contextPrims,
  dropdownPrims,
} from "@/components/bookmarks/bookmark-menu";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useApp } from "@/stores/app-store";
import type { Bookmark, Group } from "@/types";

const spring = { type: "spring", stiffness: 520, damping: 34 } as const;

type Props = { bookmark: Bookmark; group?: Group; showGroup: boolean };

export const BookmarkRow = memo(function BookmarkRow({
  bookmark,
  group,
  showGroup,
}: Props) {
  const selectMode = useApp((s) => s.selectMode);
  const selected = useApp((s) => s.selected.includes(bookmark.id));
  const renaming = useApp((s) => s.renamingId === bookmark.id);
  const setActive = useApp((s) => s.setActive);
  const setRenaming = useApp((s) => s.setRenaming);
  const toggleSelect = useApp((s) => s.toggleSelect);
  const renameBookmark = useApp((s) => s.renameBookmark);
  const committed = useRef(false);

  useEffect(() => {
    if (renaming) committed.current = false;
  }, [renaming]);

  function commit(value: string) {
    if (committed.current) return;
    committed.current = true;
    const title = value.trim();
    setRenaming(null);
    if (title && title !== bookmark.title) renameBookmark(bookmark.id, title);
  }

  const date = (
    <span suppressHydrationWarning className="text-muted-foreground tabular-nums">
      {formatDate(bookmark.createdAt)}
    </span>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.li
          layout="position"
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
          transition={spring}
          data-selected={selected}
          onPointerEnter={() => setActive(bookmark.id)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(bookmark.id)}
          onBlur={() => setActive(null)}
          className={cn(
            "group relative -mx-3 flex items-center rounded-xl px-4 py-3 transition-colors hover:bg-muted has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring/50 data-[selected=true]:bg-muted",
          )}
        >
          <AnimatePresence initial={false}>
            {selectMode && (
              <motion.span
                key="check"
                className="relative z-10 flex shrink-0 items-center overflow-hidden"
                initial={{ width: 0, marginRight: 0, opacity: 0, scale: 0.5 }}
                animate={{ width: 16, marginRight: 12, opacity: 1, scale: 1 }}
                exit={{ width: 0, marginRight: 0, opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 520, damping: 26 }}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => toggleSelect(bookmark.id)}
                  aria-label={`Select ${bookmark.title}`}
                />
              </motion.span>
            )}
          </AnimatePresence>

          <span className="mr-3 flex size-4 shrink-0 items-center justify-center">
            <Favicon bookmark={bookmark} />
          </span>

          <div className="min-w-0 flex-1">
            {renaming ? (
              <Input
                autoFocus
                defaultValue={bookmark.title}
                maxLength={200}
                aria-label="Bookmark title"
                className="relative z-10 h-7 px-2"
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => commit(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(e.currentTarget.value);
                  if (e.key === "Escape") {
                    committed.current = true;
                    setRenaming(null);
                  }
                }}
              />
            ) : (
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (selectMode) {
                    e.preventDefault();
                    toggleSelect(bookmark.id);
                  }
                }}
                className="flex min-w-0 items-baseline gap-2 outline-none after:absolute after:inset-0 after:content-['']"
              >
                <span className="truncate font-medium">{bookmark.title}</span>
                <span className="hidden truncate text-muted-foreground min-[400px]:inline">
                  {bookmark.domain}
                </span>
              </a>
            )}
            <div className="mt-0.5 flex items-center gap-2 text-xs sm:hidden">
              {date}
              {showGroup && group && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <GroupDot color={group.color} className="size-2" />
                  {group.name}
                </span>
              )}
            </div>
          </div>

          {showGroup && group && (
            <span className="mr-4 hidden max-w-28 shrink-0 items-center gap-1.5 truncate text-xs text-muted-foreground sm:flex">
              <GroupDot color={group.color} className="size-2" />
              <span className="truncate">{group.name}</span>
            </span>
          )}
          <span className="hidden shrink-0 sm:block">
            {selectMode ? (
              date
            ) : (
              <>
                <span className="group-hover:hidden group-has-[a:focus-visible]:hidden">
                  {date}
                </span>
                <Shortcut
                  keys={["mod", "enter"]}
                  className="hidden group-hover:flex group-has-[a:focus-visible]:flex"
                />
              </>
            )}
          </span>

          <div className="relative z-10 -mr-1 ml-1 sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${bookmark.title}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <BookmarkMenuItems prims={dropdownPrims} bookmark={bookmark} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.li>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <BookmarkMenuItems prims={contextPrims} bookmark={bookmark} />
      </ContextMenuContent>
    </ContextMenu>
  );
});
