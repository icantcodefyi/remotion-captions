"use client";

import { type FC } from "react";
import { SectionLabel } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import {
  ASPECT_PRESETS,
  getAspectPreset,
  type AspectPresetId,
} from "@/lib/types";

type Props = {
  value: AspectPresetId;
  onChange: (next: AspectPresetId) => void;
  sourceDimensions: { width: number; height: number } | null;
};

export const AspectControls: FC<Props> = ({
  value,
  onChange,
  sourceDimensions,
}) => {
  const current = getAspectPreset(value);
  const output =
    current.dimensions ??
    sourceDimensions ?? { width: 1080, height: 1920 };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel>Canvas</SectionLabel>
        <span className="ital-label normal-case tracking-normal text-[0.7rem] text-[color:var(--muted)]">
          <span className="tnum-serif">{output.width}</span>
          <span className="mx-[3px] opacity-60">×</span>
          <span className="tnum-serif">{output.height}</span>
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Canvas aspect ratio"
        className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-[var(--surface-2)] border border-[color:var(--border)]"
      >
        {ASPECT_PRESETS.map((preset) => {
          const selected = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${preset.label} ${preset.tick}`}
              onClick={() => onChange(preset.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1.5 py-2 rounded-[12px]",
                "transition-[background,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "[@media(hover:hover)]:hover:bg-[var(--surface-1)]",
                selected
                  ? "bg-[var(--surface-1)] text-[color:var(--fg)] shadow-[0_1px_2px_oklch(20%_0.02_90/0.08),0_0_0_1px_var(--border)]"
                  : "text-[color:var(--muted)] [@media(hover:hover)]:hover:text-[color:var(--fg)]",
              )}
            >
              <AspectGlyph preset={preset.id} selected={selected} />
              <span
                className={cn(
                  "tnum-serif text-[0.68rem] leading-none",
                  selected
                    ? "text-[color:var(--fg)]"
                    : "text-[color:var(--muted)]",
                )}
              >
                {preset.tick}
              </span>
            </button>
          );
        })}
      </div>

      <p className="ital-label text-balance normal-case tracking-normal text-[0.7rem] text-[color:var(--muted)] pl-0.5">
        {current.blurb}
      </p>
    </div>
  );
};

const AspectGlyph: FC<{ preset: AspectPresetId; selected: boolean }> = ({
  preset,
  selected,
}) => {
  const stroke = selected ? "var(--accent-ink)" : "currentColor";
  const fill = selected
    ? "color-mix(in oklab, var(--accent) 18%, transparent)"
    : "transparent";

  if (preset === "source") {
    return (
      <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden>
        <rect
          x="3.5"
          y="3.5"
          width="17"
          height="9"
          rx="1.2"
          stroke={stroke}
          strokeWidth="1.2"
          strokeDasharray="2.2 2"
          fill={fill}
        />
      </svg>
    );
  }
  const dims: Record<Exclude<AspectPresetId, "source">, [number, number]> = {
    "9x16": [9, 16],
    "1x1": [14, 14],
    "16x9": [20, 11],
  };
  const [w, h] = dims[preset as Exclude<AspectPresetId, "source">];
  const cx = 12;
  const cy = 8;
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx="1.2"
        stroke={stroke}
        strokeWidth="1.2"
        fill={fill}
      />
    </svg>
  );
};
