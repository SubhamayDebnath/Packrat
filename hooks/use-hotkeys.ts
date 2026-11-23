import { useEffect } from "react";

const isTyping = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  return (
    !!node &&
    (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.isContentEditable)
  );
};

type Handler = (e: KeyboardEvent) => void;

/** Registers one window keydown listener. Handlers decide for themselves whether to act. */
export function useKeydown(handler: Handler) {
  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}

export { isTyping };
