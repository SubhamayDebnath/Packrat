"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "@/components/settings/general-tab";
import { DangerTab } from "@/components/settings/danger-tab";
import { UsersTab } from "@/components/settings/users-tab";
import { useApp } from "@/stores/app-store";
import { useUi, type SettingsTab } from "@/stores/ui";

export function SettingsDialog() {
  const { open, tab } = useUi((s) => s.settings);
  const setOpen = useUi((s) => s.setSettingsOpen);
  const openSettings = useUi((s) => s.openSettings);
  const isAdmin = useApp((s) => s.user.isAdmin);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[88dvh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings.</DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab === "users" && !isAdmin ? "general" : tab}
          onValueChange={(v) => openSettings(v as SettingsTab)}
          className="gap-5"
        >
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
            <TabsTrigger value="danger">Danger zone</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          )}
          <TabsContent value="danger">
            <DangerTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
