"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  format?: (v: number) => string;
  className?: string;
  ariaLabel?: string;
};

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  format,
  className,
  ariaLabel,
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const id = React.useId();
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="flex items-baseline justify-between mb-2 gap-3">
          <label
            htmlFor={id}
            className="text-[0.6875rem] uppercase tracking-[0.14em] text-[color:var(--muted)] font-semibold"
          >
            {label}
          </label>
          <span
            aria-live="polite"
            className="tnum-serif text-[0.95rem] text-[color:var(--fg)]"
          >
            {format ? format(value) : value}
          </span>
        </div>
      ) : null}
      <div className="relative h-6 flex items-center">
        <div
          className="absolute inset-x-0 h-[6px] rounded-full bg-[var(--surface-3)] border border-[color:var(--border)]"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        />
        <div
          className="absolute h-[6px] rounded-full bg-[var(--accent)]"
          style={{
            width: `${pct}%`,
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 14px var(--accent-glow)",
            transition: "width 180ms var(--ease-out-quart)",
          }}
        />
        <input
          id={id}
          type="range"
          aria-label={ariaLabel ?? label}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "relative w-full h-6 appearance-none bg-transparent cursor-pointer",
            /* Webkit thumb */
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px]",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-[var(--surface-1)]",
            "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[color:var(--border-strong)]",
            "[&::-webkit-slider-thumb]:shadow-[0_1px_3px_oklch(20%_0.02_90/0.22),0_0_0_3px_var(--surface-0)]",
            "[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:transition-transform",
            "[@media(hover:hover)]:hover:[&::-webkit-slider-thumb]:scale-110",
            "active:[&::-webkit-slider-thumb]:cursor-grabbing",
            /* Firefox thumb */
            "[&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px]",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-[var(--surface-1)]",
            "[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[color:var(--border-strong)]",
          )}
        />
      </div>
    </div>
  );
};
