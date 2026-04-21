"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Option<T extends string> = {
  value: T;
  label: React.ReactNode;
};

type SegmentedProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-md font-medium transition-all",
              size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-sm",
              selected
                ? "bg-[var(--color-surface-3)] text-[var(--color-foreground)] shadow-[0_0_0_1px_var(--color-border-strong)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
