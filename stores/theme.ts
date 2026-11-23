import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
const KEY = "packrat-theme";

// Runs inline in <head>, before first paint, so there is never a flash of the wrong theme.
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  // Disable transitions for one frame so every surface switches together.
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.append(style);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
  return dark ? "dark" : "light";
}

type ThemeState = {
  theme: Theme;
  resolved: "light" | "dark";
  init: () => () => void;
  setTheme: (theme: Theme) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolved: "light",
  init: () => {
    let stored: Theme = "system";
    try {
      const v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {}
    set({
      theme: stored,
      resolved: document.documentElement.classList.contains("dark") ? "dark" : "light",
    });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (get().theme === "system")
        set({ resolved: apply("system") as "light" | "dark" });
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  },
  setTheme: (theme) => {
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
    set({ theme, resolved: apply(theme) as "light" | "dark" });
  },
}));
