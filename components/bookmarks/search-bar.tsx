"use client";

import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shortcut } from "@/components/ui/shortcut";
import { useModKey } from "@/hooks/use-platform";
import { useApp } from "@/stores/app-store";
import { useUi } from "@/stores/ui";

/** One row: the search input takes all the free width, the add button sits beside it. */
export function SearchBar() {
  const query = useApp((s) => s.query);
  const setQuery = useApp((s) => s.setQuery);
  const openAddLink = useUi((s) => s.openAddLink);
  const mod = useModKey();

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-2.5 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id="search-input"
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              e.currentTarget.blur();
            }
          }}
          placeholder="Search bookmarks"
          aria-label="Search bookmarks"
          className="h-full min-w-0 flex-1 appearance-none bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="shrink-0"
          >
            <X />
          </Button>
        ) : (
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            <Shortcut keys={["mod", "F"]} />
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        onClick={() => openAddLink()}
        aria-label="Add a link"
        title={`Add a link (${mod} K)`}
      >
        <Plus />
      </Button>
    </div>
  );
}
