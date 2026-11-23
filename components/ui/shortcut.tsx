"use client";

import { Command, CornerDownLeft, Delete } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useModKey } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";

/**
 * Keys are written as tokens: "mod" is ⌘ on Apple devices and Ctrl elsewhere
 * (Windows and Linux shortcuts use Ctrl, not the Windows key), "backspace" and "enter" get icons.
 */
export function Shortcut({ keys, className }: { keys: string[]; className?: string }) {
  const mod = useModKey();
  return (
    <span className={cn("flex items-center gap-1", className)}>
      {keys.map((key) => (
        <Kbd key={key}>
          {key === "mod" ? (
            mod === "⌘" ? (
              <Command className="size-3" aria-label="Command" />
            ) : (
              "Ctrl"
            )
          ) : key === "backspace" ? (
            <Delete className="size-3.5" aria-label="Backspace" />
          ) : key === "enter" ? (
            <CornerDownLeft className="size-3" aria-label="Enter" />
          ) : (
            key
          )}
        </Kbd>
      ))}
    </span>
  );
}
