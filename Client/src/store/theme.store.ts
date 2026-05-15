import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (theme: Theme) => void;
}

const getInitial = (): Theme => {
  const stored = localStorage.getItem("theme") as Theme;
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitial(),
  toggle: () =>
    set((s: any) => {
      const next = s.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return { theme: next };
    }),
  set: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
}));
