"use client";

import { GroupSwitcher } from "@/components/layout/group-switcher";
import { Logo } from "@/components/layout/logo";
import { UserMenu } from "@/components/layout/user-menu";

/** Full-width bar; its content is capped at max-w-4xl. The page body below is narrower (max-w-2xl). */
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <Logo />
          <GroupSwitcher />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
