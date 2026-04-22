"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  className,
}: Props) {
  const id = useId();
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className,
      )}
    >
      {(label || description) && (
        <div className="flex flex-col min-w-0">
          {label && (
            <label
              htmlFor={id}
              className="text-[0.6875rem] uppercase tracking-[0.14em] text-[color:var(--muted)] font-semibold cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <span
              id={descId}
              className="text-[0.75rem] text-[color:var(--muted)] mt-1 leading-relaxed"
            >
              {description}
            </span>
          )}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative shrink-0 inline-flex h-6 w-11 rounded-full border",
          "transition-[background,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "[@media(pointer:coarse)]:h-7 [@media(pointer:coarse)]:w-12",
          checked
            ? "bg-[var(--accent)] border-transparent"
            : "bg-[var(--surface-3)] border-[color:var(--border-strong)]",
        )}
        style={{
          boxShadow: checked
            ? "0 0 14px var(--accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.3)"
            : "inset 0 1px 2px oklch(20% 0.02 90 / 0.06)",
        }}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white",
            "shadow-[0_1px_3px_oklch(20%_0.02_90/0.22)]",
            "transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "[@media(pointer:coarse)]:h-6 [@media(pointer:coarse)]:w-6",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
