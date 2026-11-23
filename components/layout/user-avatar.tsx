import { GROUP_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  const color = GROUP_COLORS[hash(name) % GROUP_COLORS.length];
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white uppercase",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1)}
    </span>
  );
}
