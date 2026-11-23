"use client";

import { Bookmark, SearchX } from "lucide-react";
import { motion } from "motion/react";

export function EmptyState({ query }: { query: string }) {
  const Icon = query ? SearchX : Bookmark;
  return (
    <motion.div
      className="flex flex-col items-center gap-1 pt-20 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.05 }}
      >
        <Icon
          className="size-7 fill-current text-foreground/80"
          strokeWidth={query ? 1.75 : 0}
        />
      </motion.div>
      {query ? (
        <>
          <p className="mt-2 max-w-full truncate font-medium">No results for “{query}”</p>
          <p className="text-muted-foreground">
            Try a different title, link or group name.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 font-medium">No bookmarks here</p>
          <p className="text-muted-foreground">Add some cool links to get started</p>
        </>
      )}
    </motion.div>
  );
}
