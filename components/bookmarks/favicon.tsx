"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import type { Bookmark } from "@/types";

export function Favicon({
  bookmark,
  className = "size-4",
}: {
  bookmark: Pick<Bookmark, "id" | "favicon">;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!bookmark.favicon || failed) {
    return (
      <Globe
        className={`${className} shrink-0 text-muted-foreground`}
        strokeWidth={1.75}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny same-origin icon, next/image adds nothing
    <img
      src={`/api/bookmarks/${bookmark.id}/favicon?v=${bookmark.favicon}`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-[3px] object-contain`}
    />
  );
}
