"use client";

import type { ElementType } from "react";
import { ChevronsRight, Copy, ListChecks, Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Shortcut } from "@/components/ui/shortcut";
import { GroupDot } from "@/components/bookmarks/group-dot";
import { useBookmarkActions } from "@/hooks/use-bookmark-actions";
import { useApp } from "@/stores/app-store";
import type { Bookmark } from "@/types";

type Prims = {
  Item: ElementType;
  Separator: ElementType;
  Sub: ElementType;
  SubTrigger: ElementType;
  SubContent: ElementType;
};

export const contextPrims: Prims = {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

export const dropdownPrims: Prims = {
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};

function Keys({ keys }: { keys: string[] }) {
  return <Shortcut keys={keys} className="ml-auto pl-6" />;
}

/** One menu definition, rendered by both the right-click menu and the mobile "more" menu. */
export function BookmarkMenuItems({
  prims,
  bookmark,
}: {
  prims: Prims;
  bookmark: Bookmark;
}) {
  const { Item, Separator, Sub, SubTrigger, SubContent } = prims;
  const actions = useBookmarkActions();
  const groups = useApp((s) => s.groups);
  const others = groups.filter((g) => g.id !== bookmark.groupId);

  return (
    <>
      <Item onSelect={() => actions.copy(bookmark)}>
        <Copy /> Copy
        <Keys keys={["mod", "C"]} />
      </Item>
      <Item onSelect={() => actions.rename(bookmark)}>
        <Pencil /> Rename
        <Keys keys={["mod", "E"]} />
      </Item>
      <Item variant="destructive" onSelect={() => actions.remove(bookmark)}>
        <Trash2 /> Delete
        <Keys keys={["mod", "backspace"]} />
      </Item>
      <Item onSelect={() => actions.refetch(bookmark)}>
        <RefreshCw /> Refetch
      </Item>
      <Sub>
        <SubTrigger disabled={!others.length}>
          <ChevronsRight /> Move to…
        </SubTrigger>
        <SubContent className="w-48">
          {others.map((g) => (
            <Item
              key={g.id}
              onSelect={() => actions.move(bookmark, g.id)}
              className="gap-2.5"
            >
              <GroupDot color={g.color} />
              <span className="truncate">{g.name}</span>
            </Item>
          ))}
        </SubContent>
      </Sub>
      <Separator />
      <Item onSelect={() => actions.select(bookmark)}>
        <ListChecks /> Select multiple
      </Item>
    </>
  );
}
