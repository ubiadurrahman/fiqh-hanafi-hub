import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "fh_theme";

interface Ctx {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  cycle: () => void;
}
const ThemeContext = createContext<Ctx | null>(null);

const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

function paintTheme(dark: boolean) {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const meta = document.querySelector('meta[name="theme-color"]');
  const apply = () => {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    meta?.setAttribute("content", dark ? "#0a0a0a" : "#047857");
  };

  if (reduced || root.classList.contains("dark") === dark) {
    apply();
    return;
  }

  const start = (
    document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }
  ).startViewTransition?.bind(document);

  if (start) {
    root.classList.add("theme-vt");
    const transition = start(apply);
    transition.finished.finally(() => root.classList.remove("theme-vt"));
    return;
  }

  root.classList.add("theme-animate");
  apply();
  window.setTimeout(() => root.classList.remove("theme-animate"), 600);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(KEY) as Theme) || "system";
    } catch {
      return "system";
    }
  });
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      paintTheme(mq.matches);
      setIsDark(mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    const dark = t === "dark" || (t === "system" && systemDark());
    paintTheme(dark);
    setIsDark(dark);
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const cycle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, isDark, setTheme, cycle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
