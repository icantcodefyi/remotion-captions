"use client";

import { type FC, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

export const ThemeToggle: FC<{ className?: string }> = ({
  className,
}) => {
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("meowcap-theme-change", onStoreChange);
      return () =>
        window.removeEventListener("meowcap-theme-change", onStoreChange);
    },
    () => (document.documentElement.dataset.theme as Theme) ?? "light",
    () => "light",
  );

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("meowcap-theme", next);
    } catch {}
    window.dispatchEvent(new Event("meowcap-theme-change"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={cn(
        "relative inline-flex items-center justify-center h-8 w-8 rounded-md",
        "bg-transparent text-[color:var(--fg-weak)]",
        "transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
        "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
        "[@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-10",
        className,
      )}
    >
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center h-4 w-4"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </span>
    </button>
  );
};
