import Link from "next/link";
import { Rat } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-1 px-4 text-center">
      <Rat className="size-8 text-foreground/80" strokeWidth={1.5} aria-hidden />
      <p className="mt-3 text-base font-semibold">404</p>
      <p className="text-muted-foreground">
        This page doesn&rsquo;t exist, or it was moved.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/">Back to bookmarks</Link>
      </Button>
    </main>
  );
}
