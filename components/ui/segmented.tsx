"use client";

import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";

type Option<T extends string> = {
  value: T;
  label: ReactNode;
};

type SegmentedProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % options.length;
    else if (e.key === "ArrowLeft")
      next = (i - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center p-1 rounded-lg",
        "bg-[var(--surface-2)] border border-[color:var(--border)]",
        className,
      )}
    >
      {options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (selectedIndex < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative flex-1 rounded-[12px] font-medium",
              "transition-[background,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
              size === "sm"
                ? "h-7 px-3 text-[0.75rem] [@media(pointer:coarse)]:h-9"
                : "h-9 px-4 text-[0.8125rem] [@media(pointer:coarse)]:h-10",
              selected
                ? "bg-[var(--surface-1)] text-[color:var(--fg)] shadow-[0_1px_2px_oklch(20%_0.02_90/0.08),0_0_0_1px_var(--border)]"
                : "text-[color:var(--muted)] [@media(hover:hover)]:hover:text-[color:var(--fg)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
