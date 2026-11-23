import { useState } from "react";

/** Bumping `key` re-mounts the motion wrapper so the shake plays on every failed attempt. */
export function useShake() {
  const [count, setCount] = useState(0);
  return { shakeKey: count, shake: () => setCount((c) => c + 1) };
}
