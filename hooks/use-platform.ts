import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** "mac" on the server and on Apple devices; the snapshot differs only after hydration, so there is no mismatch error. */
export function useModKey() {
  return useSyncExternalStore(
    subscribe,
    () =>
      /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl",
    () => "⌘",
  );
}
