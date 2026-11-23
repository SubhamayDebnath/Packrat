"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api-client";
import { GROUP_COOKIE } from "@/lib/constants";
import type { Bookmark, Group, ImportPayload, User } from "@/types";

export type AppState = {
  user: User;
  groups: Group[];
  bookmarks: Bookmark[];
  currentGroupId: string;
  query: string;
  page: number;
  selectMode: boolean;
  selected: string[];
  activeId: string | null;
  renamingId: string | null;

  setUser: (user: User) => void;
  setQuery: (query: string) => void;
  setPage: (page: number) => void;
  setCurrentGroup: (id: string) => void;
  setActive: (id: string | null) => void;
  setRenaming: (id: string | null) => void;
  enterSelect: (id?: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  clearSelection: () => void;

  refresh: () => Promise<void>;
  addBookmark: (input: {
    url: string;
    groupId: string;
    title?: string;
  }) => Promise<Bookmark>;
  renameBookmark: (id: string, title: string) => Promise<void>;
  deleteBookmarks: (ids: string[]) => Promise<void>;
  moveBookmarks: (ids: string[], groupId: string) => Promise<void>;
  refetchBookmark: (id: string) => Promise<void>;
  saveGroup: (
    input: { name: string; color: string; isPublic?: boolean },
    id?: string,
  ) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
  shareGroup: (id: string, isPublic: boolean) => Promise<Group>;
  importBookmarks: (payload: ImportPayload) => Promise<void>;
};

type Init = Pick<
  AppState,
  "user" | "groups" | "bookmarks" | "currentGroupId" | "query" | "page"
>;

const plural = (n: number) => `${n} bookmark${n === 1 ? "" : "s"}`;
const message = (e: unknown) =>
  e instanceof ApiClientError ? e.message : "Something went wrong. Try again.";

// Search and page live in the URL (?q=…&page=…), so a reload lands exactly where you were.
// Debounced because Safari throttles history.replaceState.
let urlTimer: ReturnType<typeof setTimeout> | undefined;
function syncUrl(query: string, page: number) {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (page > 1) params.set("page", String(page));
      const qs = params.toString();
      window.history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
    } catch {}
  }, 250);
}

function createAppStore(init: Init) {
  return createStore<AppState>()((set, get) => ({
    ...init,
    selectMode: false,
    selected: [],
    activeId: null,
    renamingId: null,

    setUser: (user) => set({ user }),
    setQuery: (query) => {
      set({ query, page: 1 });
      syncUrl(query, 1);
    },
    setPage: (page) => {
      set({ page });
      syncUrl(get().query, page);
    },
    setCurrentGroup: (id) => {
      document.cookie = `${GROUP_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
      set({ currentGroupId: id, page: 1, selected: [], selectMode: false });
      syncUrl(get().query, 1);
    },
    setActive: (activeId) => set({ activeId }),
    setRenaming: (renamingId) => set({ renamingId }),
    enterSelect: (id) => set({ selectMode: true, selected: id ? [id] : [] }),
    toggleSelect: (id) =>
      set((s) => ({
        selected: s.selected.includes(id)
          ? s.selected.filter((x) => x !== id)
          : [...s.selected, id],
      })),
    selectAll: (ids) => set((s) => ({ selected: [...new Set([...s.selected, ...ids])] })),
    deselectAll: () => set({ selected: [] }),
    clearSelection: () => set({ selectMode: false, selected: [] }),

    refresh: async () => {
      const data = await api<{ groups: Group[]; bookmarks: Bookmark[] }>("/data");
      set((s) => ({
        groups: data.groups,
        bookmarks: data.bookmarks,
        selected: [],
        currentGroupId: data.groups.some((g) => g.id === s.currentGroupId)
          ? s.currentGroupId
          : data.groups[0].id,
      }));
    },

    addBookmark: async (input) => {
      const { bookmark } = await api<{ bookmark: Bookmark }>("/bookmarks", {
        method: "POST",
        body: input,
      });
      set((s) => ({ bookmarks: [bookmark, ...s.bookmarks] }));
      return bookmark;
    },

    renameBookmark: async (id, title) => {
      const prev = get().bookmarks;
      set({ bookmarks: prev.map((b) => (b.id === id ? { ...b, title } : b)) });
      try {
        await api(`/bookmarks/${id}`, { method: "PATCH", body: { title } });
      } catch (e) {
        set({ bookmarks: prev });
        toast.error(message(e));
      }
    },

    deleteBookmarks: async (ids) => {
      const prev = get().bookmarks;
      const gone = new Set(ids);
      set((s) => ({
        bookmarks: s.bookmarks.filter((b) => !gone.has(b.id)),
        selected: s.selected.filter((x) => !gone.has(x)),
      }));
      try {
        if (ids.length === 1) await api(`/bookmarks/${ids[0]}`, { method: "DELETE" });
        else
          await api("/bookmarks/bulk", {
            method: "POST",
            body: { action: "delete", ids },
          });
        toast.success(`Deleted ${plural(ids.length)}`);
      } catch (e) {
        set({ bookmarks: prev });
        toast.error(message(e));
      }
    },

    moveBookmarks: async (ids, groupId) => {
      const prev = get().bookmarks;
      const moving = new Set(ids);
      const target = get().groups.find((g) => g.id === groupId);
      set((s) => ({
        bookmarks: s.bookmarks.map((b) => (moving.has(b.id) ? { ...b, groupId } : b)),
      }));
      try {
        if (ids.length === 1)
          await api(`/bookmarks/${ids[0]}`, { method: "PATCH", body: { groupId } });
        else
          await api("/bookmarks/bulk", {
            method: "POST",
            body: { action: "move", ids, groupId },
          });
        toast.success(`Moved ${plural(ids.length)} to ${target?.name ?? "group"}`);
      } catch (e) {
        set({ bookmarks: prev });
        toast.error(message(e));
      }
    },

    refetchBookmark: async (id) => {
      const t = toast.loading("Fetching details…");
      try {
        const { bookmark } = await api<{ bookmark: Bookmark }>(
          `/bookmarks/${id}/refetch`,
          {
            method: "POST",
          },
        );
        set((s) => ({ bookmarks: s.bookmarks.map((b) => (b.id === id ? bookmark : b)) }));
        toast.success("Details updated", { id: t });
      } catch (e) {
        toast.error(message(e), { id: t });
      }
    },

    saveGroup: async (input, id) => {
      const { group } = await api<{ group: Group }>(id ? `/groups/${id}` : "/groups", {
        method: id ? "PATCH" : "POST",
        body: input,
      });
      set((s) => ({
        groups: id
          ? s.groups.map((g) => (g.id === id ? group : g))
          : [...s.groups, group],
      }));
      return group;
    },

    shareGroup: async (id, isPublic) => {
      const { group } = await api<{ group: Group }>(`/groups/${id}`, {
        method: "PATCH",
        body: { isPublic },
      });
      set((s) => ({ groups: s.groups.map((g) => (g.id === id ? group : g)) }));
      return group;
    },

    // Deleting a group deletes every bookmark inside it.
    deleteGroup: async (id) => {
      const res = await api<{ fallbackId: string }>(`/groups/${id}`, {
        method: "DELETE",
      });
      set((s) => ({
        groups: s.groups.filter((g) => g.id !== id),
        bookmarks: s.bookmarks.filter((b) => b.groupId !== id),
      }));
      get().setCurrentGroup(res.fallbackId);
    },

    importBookmarks: async (payload) => {
      const t = toast.loading("Importing bookmarks…");
      try {
        const r = await api<{ imported: number; skipped: number; groups: number }>(
          "/bookmarks/import",
          { method: "POST", body: payload },
        );
        await get().refresh();
        toast.success(`Imported ${plural(r.imported)}`, {
          id: t,
          description: r.skipped
            ? `${r.skipped} duplicates or invalid links skipped`
            : undefined,
        });
      } catch (e) {
        toast.error(message(e), { id: t });
      }
    },
  }));
}

const Ctx = createContext<StoreApi<AppState> | null>(null);

/** One store per mounted tree. A module-level store would leak one user's data to another during SSR. */
export function AppStoreProvider({
  init,
  children,
}: {
  init: Init;
  children: ReactNode;
}) {
  const [store] = useState(() => createAppStore(init));
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useApp<T>(selector: (s: AppState) => T): T {
  const store = useContext(Ctx);
  if (!store) throw new Error("useApp must be used inside AppStoreProvider");
  return useStore(store, selector);
}

export function useAppApi() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useAppApi must be used inside AppStoreProvider");
  return store;
}
