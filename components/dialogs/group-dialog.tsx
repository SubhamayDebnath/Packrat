"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiClientError } from "@/lib/api-client";
import { GROUP_COLORS } from "@/lib/constants";
import { groupSchema } from "@/lib/validators";
import { useApp, useAppApi } from "@/stores/app-store";
import { useUi } from "@/stores/ui";
import type { Group } from "@/types";

export function GroupDialog() {
  const { open, group } = useUi((s) => s.groupDialog);
  const close = useUi((s) => s.closeGroupDialog);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <GroupForm group={group} onDone={close} />
      </DialogContent>
    </Dialog>
  );
}

function GroupForm({ group, onDone }: { group: Group | null; onDone: () => void }) {
  const store = useAppApi();
  const groupCount = useApp((s) => s.groups.length);
  const [name, setName] = useState(group?.name ?? "");
  const [color, setColor] = useState<string>(
    group && (GROUP_COLORS as readonly string[]).includes(group.color)
      ? group.color
      : GROUP_COLORS[groupCount % GROUP_COLORS.length],
  );
  const [isPublic, setIsPublic] = useState(group?.isPublic ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const editing = !!group;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = groupSchema.safeParse({ name, color });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    try {
      const saved = await store
        .getState()
        .saveGroup({ ...parsed.data, isPublic }, group?.id);
      if (!editing) store.getState().setCurrentGroup(saved.id);
      const justShared =
        saved.isPublic && saved.shareId && saved.isPublic !== !!group?.isPublic;
      if (justShared) {
        await navigator.clipboard
          ?.writeText(`${location.origin}/s/${saved.shareId}`)
          .catch(() => {});
      }
      toast.success(editing ? "Group updated" : "Group created", {
        description: justShared ? "Public link copied" : undefined,
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit group" : "Create group"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Change the name or color of this group."
            : "Create a new group to organize your bookmarks."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="group-name">Name</Label>
        <Input
          id="group-name"
          autoFocus
          maxLength={40}
          placeholder="Enter group name"
          value={name}
          aria-invalid={!!error}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="grid gap-2">
        <Label>Color</Label>
        <div
          role="radiogroup"
          aria-label="Group color"
          className="grid grid-cols-6 gap-2 sm:grid-cols-12"
        >
          {GROUP_COLORS.map((c) => (
            <motion.button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className="flex aspect-square w-full items-center justify-center rounded-full text-white outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
              style={{ backgroundColor: c }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.85 }}
              animate={{ scale: color === c ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 17 }}
            >
              {color === c && <Check className="size-3.5" strokeWidth={3} />}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="min-w-0">
          <Label htmlFor="group-public">Public</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Off, only you can see this group. On, anyone with its link can view it.
          </p>
        </div>
        <Switch id="group-public" checked={isPublic} onCheckedChange={setIsPublic} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy && <Loader2 className="animate-spin" />}
          {editing ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
