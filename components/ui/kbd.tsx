import * as React from "react"
import { cn } from "cn"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-muted px-1.5 font-sans text-xs font-medium text-muted-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
