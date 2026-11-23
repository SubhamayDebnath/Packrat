"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function windowOf(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      {windowOf(page, pages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? "outline" : "ghost"}
            size="icon-sm"
            className="w-auto min-w-8 px-2 tabular-nums"
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onChange(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
