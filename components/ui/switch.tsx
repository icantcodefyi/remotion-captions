"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
};

export const Switch: React.FC<Props> = ({
  checked,
  onCheckedChange,
  label,
  description,
  className,
}) => {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 cursor-pointer select-none",
        className,
      )}
    >
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-medium">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[var(--color-muted)] mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCheckedChange(!checked);
          }
        }}
        tabIndex={0}
        className={cn(
          "relative inline-flex h-5 w-9 rounded-full border transition-colors",
          checked
            ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
            : "bg-[var(--color-surface-3)] border-[var(--color-border-strong)]",
        )}
        style={{
          boxShadow: checked
            ? "0 0 18px var(--color-accent-glow)"
            : undefined,
        }}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </label>
  );
};
