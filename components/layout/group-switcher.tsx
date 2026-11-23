"use client";

import { Check, ChevronsUpDown, Globe, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupDot } from "@/components/bookmarks/group-dot";
import { useUi } from "@/stores/ui";
import { useApp, useAppApi } from "@/stores/app-store";
import { ApiClientError } from "@/lib/api-client";

export function GroupSwitcher() {
  const groups = useApp((s) => s.groups);
  const bookmarks = useApp((s) => s.bookmarks);
  const currentId = useApp((s) => s.currentGroupId);
  const setCurrent = useApp((s) => s.setCurrentGroup);
  const store = useAppApi();
  const { openGroupDialog, askConfirm } = useUi();

  const current = groups.find((g) => g.id === currentId) ?? groups[0];
  const counts = new Map<string, number>();
  for (const b of bookmarks) counts.set(b.groupId, (counts.get(b.groupId) ?? 0) + 1);

  async function toggleShare() {
    try {
      const group = await store.getState().shareGroup(current.id, !current.isPublic);
      if (group.isPublic && group.shareId) {
        await navigator.clipboard
          ?.writeText(`${location.origin}/s/${group.shareId}`)
          .catch(() => {});
        toast.success("Group is public", {
          description: "The link was copied. Anyone with it can view this group.",
        });
      } else {
        toast.success("Group is private again", {
          description: "The old link no longer works.",
        });
      }
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : "Could not update sharing");
    }
  }

  function deleteGroup() {
    askConfirm({
      title: `Delete “${current.name}”?`,
      description: "Every bookmark inside this group will be deleted permanently.",
      actionLabel: "Delete group",
      destructive: true,
      onConfirm: async () => {
        try {
          await store.getState().deleteGroup(current.id);
          toast.success("Group deleted");
        } catch (e) {
          toast.error(e instanceof ApiClientError ? e.message : "Could not delete group");
        }
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="max-w-48 gap-2 rounded-lg px-2.5 data-[state=open]:bg-muted"
          aria-label="Switch group"
        >
          <GroupDot color={current.color} />
          <span className="truncate font-medium">{current.name}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {groups.map((g) => (
          <DropdownMenuItem
            key={g.id}
            onSelect={() => setCurrent(g.id)}
            className="gap-2.5"
          >
            <GroupDot color={g.color} />
            <span className="flex-1 truncate">{g.name}</span>
            {g.isPublic && (
              <Globe className="size-3.5 text-muted-foreground" aria-label="Public" />
            )}
            {g.id === current.id ? (
              <Check className="size-4" />
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">
                {counts.get(g.id) ?? 0}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openGroupDialog(null)}>
          <Plus /> Create group
        </DropdownMenuItem>
        {!current.isDefault && (
          <DropdownMenuItem onSelect={() => openGroupDialog(current)}>
            <Pencil /> Edit group
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={toggleShare}>
          {current.isPublic ? <Lock /> : <Globe />}
          {current.isPublic ? "Make private" : "Make public"}
        </DropdownMenuItem>
        {!current.isDefault && (
          <DropdownMenuItem variant="destructive" onSelect={deleteGroup}>
            <Trash2 /> Delete group
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
