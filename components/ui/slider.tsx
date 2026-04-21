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
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-medium">
            {label}
          </span>
          <span className="text-xs font-mono text-[var(--color-muted-strong)] tabular-nums">
            {format ? format(value) : value}
          </span>
        </div>
      ) : null}
      <div className="relative h-5 flex items-center">
        <div
          className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--color-border)]"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        />
        <div
          className="absolute h-1.5 rounded-full bg-[var(--color-accent)]"
          style={{
            width: `${pct}%`,
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 18px var(--color-accent-glow)",
          }}
        />
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "relative w-full h-5 appearance-none bg-transparent cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--color-border-strong)] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.5)] [&::-webkit-slider-thumb]:cursor-grab",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0",
          )}
        />
      </div>
    </div>
  );
};
