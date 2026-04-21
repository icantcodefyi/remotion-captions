"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

export const ThemeToggle: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) ?? "light";
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("meowcap-theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={cn(
        "relative inline-flex items-center justify-center h-8 w-8 rounded-md",
        "border border-[color:var(--border)] bg-[var(--surface-1)]",
        "text-[color:var(--muted)]",
        "transition-[transform,background,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "[@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
        "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
        "[@media(hover:hover)]:hover:-translate-y-[1px]",
        "[@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-10",
        className,
      )}
    >
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center h-4 w-4"
      >
        {mounted ? (
          theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )
        ) : (
          <Moon className="h-4 w-4 opacity-0" />
        )}
      </span>
    </button>
  );
};
