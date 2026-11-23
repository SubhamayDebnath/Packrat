import { create } from "zustand";
import type { Group } from "@/types";

export type SettingsTab = "general" | "users" | "danger";

type Confirm = {
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  /** If set, the user must type this exact word before the action unlocks. */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
};

type UiState = {
  addLink: { open: boolean; url: string };
  settings: { open: boolean; tab: SettingsTab };
  shortcutsOpen: boolean;
  groupDialog: { open: boolean; group: Group | null };
  confirm: Confirm | null;
  openAddLink: (url?: string) => void;
  closeAddLink: () => void;
  openSettings: (tab?: SettingsTab) => void;
  setSettingsOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  openGroupDialog: (group?: Group | null) => void;
  closeGroupDialog: () => void;
  askConfirm: (confirm: Confirm) => void;
  closeConfirm: () => void;
};

// Holds only dialog open/closed flags, never user data, so a module-level store is safe in SSR.
export const useUi = create<UiState>((set) => ({
  addLink: { open: false, url: "" },
  settings: { open: false, tab: "general" },
  shortcutsOpen: false,
  groupDialog: { open: false, group: null },
  confirm: null,
  openAddLink: (url = "") => set({ addLink: { open: true, url } }),
  closeAddLink: () => set({ addLink: { open: false, url: "" } }),
  openSettings: (tab = "general") => set({ settings: { open: true, tab } }),
  setSettingsOpen: (open) => set((s) => ({ settings: { ...s.settings, open } })),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  openGroupDialog: (group = null) => set({ groupDialog: { open: true, group } }),
  closeGroupDialog: () =>
    set((s) => ({ groupDialog: { ...s.groupDialog, open: false } })),
  askConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
}));
