"use client";

import {
  ChevronsUpDown,
  Keyboard,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/layout/user-avatar";
import { api } from "@/lib/api-client";
import { useApp } from "@/stores/app-store";
import { useThemeStore, type Theme } from "@/stores/theme";
import { useUi } from "@/stores/ui";

export function UserMenu() {
  const user = useApp((s) => s.user);
  const { theme, setTheme } = useThemeStore();
  const { openSettings, setShortcutsOpen } = useUi();

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST" });
      window.location.replace("/login");
    } catch {
      toast.error("Could not sign out. Try again.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 gap-2 rounded-lg p-0 data-[state=open]:bg-muted sm:w-auto sm:pr-2 sm:pl-1.5"
          aria-label="Account menu"
        >
          <UserAvatar name={user.username} className="size-5 text-[10px]" />
          <span className="hidden max-w-32 truncate font-medium sm:inline">
            {user.username}
          </span>
          <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => openSettings("general")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette /> Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as Theme)}
            >
              <DropdownMenuRadioItem value="light">
                <Sun /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
          <Keyboard /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
