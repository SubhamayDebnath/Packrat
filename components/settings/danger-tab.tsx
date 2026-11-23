"use client";

import { Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiClientError } from "@/lib/api-client";
import { useApp, useAppApi } from "@/stores/app-store";
import { useUi } from "@/stores/ui";

const fail = (e: unknown) =>
  toast.error(
    e instanceof ApiClientError ? e.message : "Something went wrong. Try again.",
  );

/** Both actions ask twice: a first confirmation, then a final one where you type DELETE. */
export function DangerTab() {
  const store = useAppApi();
  const isAdmin = useApp((s) => s.user.isAdmin);
  const askConfirm = useUi((s) => s.askConfirm);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);

  function deleteData() {
    askConfirm({
      title: "Delete all your data?",
      description:
        "Every group and bookmark you have will be removed. Your account stays.",
      actionLabel: "Continue",
      destructive: true,
      onConfirm: () =>
        askConfirm({
          title: "This cannot be undone",
          description:
            "All your groups and bookmarks will be deleted permanently. Type DELETE to confirm.",
          actionLabel: "Delete all data",
          destructive: true,
          requireText: "DELETE",
          onConfirm: async () => {
            try {
              await api("/data", { method: "DELETE" });
              await store.getState().refresh();
              setSettingsOpen(false);
              toast.success("All your data was deleted");
            } catch (e) {
              fail(e);
            }
          },
        }),
    });
  }

  function deleteAccount() {
    askConfirm({
      title: "Delete your account?",
      description:
        "Your account, groups and bookmarks will be removed, and you will be signed out.",
      actionLabel: "Continue",
      destructive: true,
      onConfirm: () =>
        askConfirm({
          title: "This cannot be undone",
          description:
            "Your account and everything in it will be deleted permanently. Type DELETE to confirm.",
          actionLabel: "Delete account",
          destructive: true,
          requireText: "DELETE",
          onConfirm: async () => {
            try {
              await api("/me", { method: "DELETE" });
              window.location.replace("/login");
            } catch (e) {
              fail(e);
            }
          },
        }),
    });
  }

  return (
    <div className="grid gap-2">
      <Label>Danger zone</Label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="destructive" onClick={deleteData}>
          <Trash2 /> Delete data
        </Button>
        {!isAdmin && (
          <Button type="button" variant="destructive" onClick={deleteAccount}>
            <UserX /> Delete account
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Delete data removes all your groups and bookmarks. Delete account removes your
        account and everything in it. Only your own data is affected, never anyone
        else&rsquo;s.
      </p>
      {isAdmin && (
        <p className="text-xs text-muted-foreground">
          The admin account can&rsquo;t be deleted here. To remove it, delete the database
          and the hosting yourself.
        </p>
      )}
    </div>
  );
}
