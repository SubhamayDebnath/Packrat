"use client";

import { Rat } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-1 px-4 text-center">
      <Rat className="size-8 text-foreground/80" strokeWidth={1.5} aria-hidden />
      <p className="mt-3 text-base font-semibold">Something broke</p>
      <p className="max-w-xs text-muted-foreground">
        The server could not finish that request. Check that your database is reachable,
        then try again.
      </p>
      <Button variant="outline" className="mt-5" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
