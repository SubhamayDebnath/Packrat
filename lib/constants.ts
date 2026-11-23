export const APP_NAME = "Packrat";

// 12 swatches: fills one row in the group dialog.
export const GROUP_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#84cc16", // lime
  "#d946ef", // fuchsia
] as const;

export const DEFAULT_GROUP_NAME = "Bookmarks";
export const DEFAULT_GROUP_COLOR = GROUP_COLORS[0];

export const SESSION_COOKIE = "pr_session";
export const GROUP_COOKIE = "pr_group";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const ACTIVATION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
