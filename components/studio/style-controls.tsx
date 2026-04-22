"use client";

import Link from "next/link";
import { Move } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SectionLabel } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { getBlogHref } from "@/lib/site";
import { POSITION_PRESETS, type StyleOptions } from "@/lib/types";

const COLOR_PRESETS = [
  "#C4FF3D",
  "#39E508",
  "#FFD54A",
  "#FF3D7F",
  "#4FC3F7",
  "#C4B5FD",
  "#00FFD1",
  "#FF914D",
  "#FFFFFF",
];

type Props = {
  value: StyleOptions;
  onChange: (next: StyleOptions) => void;
};

export function StyleControls({ value, onChange }: Props) {
  function set<K extends keyof StyleOptions>(key: K, v: StyleOptions[K]) {
    onChange({ ...value, [key]: v });
  }

  const activePresetId = POSITION_PRESETS.find(
    (p) =>
      Math.abs(p.value.x - value.position.x) < 0.01 &&
      Math.abs(p.value.y - value.position.y) < 0.01,
  )?.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <SectionLabel>Position</SectionLabel>
          <span className="flex items-center gap-1 text-[0.65rem] text-[color:var(--muted)] ital-label normal-case tracking-normal">
            <Move className="h-3 w-3" />
            drag on preview to fine-tune
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Caption position"
          className="inline-flex items-center p-1 rounded-lg bg-[var(--surface-2)] border border-[color:var(--border)] w-full"
        >
          {POSITION_PRESETS.map((preset) => {
            const selected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set("position", preset.value)}
                className={cn(
                  "relative flex-1 rounded-[12px] font-medium h-7 px-3 text-[0.75rem]",
                  "transition-[background,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "[@media(pointer:coarse)]:h-9",
                  selected
                    ? "bg-[var(--surface-1)] text-[color:var(--fg)] shadow-[0_1px_2px_oklch(20%_0.02_90/0.08),0_0_0_1px_var(--border)]"
                    : "text-[color:var(--muted)] [@media(hover:hover)]:hover:text-[color:var(--fg)]",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        {!activePresetId ? (
          <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 bg-[var(--surface-2)] border border-[color:var(--border)]">
            <span className="ital-label normal-case tracking-normal text-[0.7rem] text-[color:var(--muted)]">
              custom
            </span>
            <span className="tnum-serif text-[0.7rem] text-[color:var(--fg)]">
              {Math.round(value.position.x * 100)}% · {Math.round(value.position.y * 100)}%
            </span>
          </div>
        ) : null}
      </div>

      <Slider
        label="Font size"
        value={value.fontScale}
        min={0.5}
        max={1.8}
        step={0.05}
        onChange={(v) => set("fontScale", v)}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label="Words per page"
        value={value.wordsPerPage}
        min={1}
        max={10}
        step={1}
        onChange={(v) => set("wordsPerPage", v)}
      />

      <div className="flex flex-col gap-2.5">
        <SectionLabel>Accent color</SectionLabel>
        <div
          className="flex flex-wrap gap-2 p-1"
          role="radiogroup"
          aria-label="Accent color"
        >
          {COLOR_PRESETS.map((c) => {
            const selected = value.accentColor.toUpperCase() === c.toUpperCase();
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set("accentColor", c)}
                className={[
                  "relative h-7 w-7 rounded-full",
                  "border border-[color:var(--border-strong)]",
                  "transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "[@media(hover:hover)]:hover:scale-110",
                  "[@media(hover:hover)]:hover:-translate-y-[1px]",
                  "[@media(pointer:coarse)]:h-9 [@media(pointer:coarse)]:w-9",
                ].join(" ")}
                style={{
                  background: c,
                  boxShadow: selected
                    ? `0 0 0 2px var(--surface-1), 0 0 0 4px ${c}, 0 4px 10px -4px ${c}66`
                    : "inset 0 1px 0 oklch(100% 0 0 / 0.2), 0 1px 2px oklch(20% 0.02 90 / 0.06)",
                }}
                aria-label={`Accent ${c}`}
                title={c}
              />
            );
          })}
          <label
            className={[
              "relative h-7 w-7 rounded-full",
              "border border-dashed border-[color:var(--border-strong)]",
              "flex items-center justify-center cursor-pointer",
              "text-[color:var(--muted)] transition-colors",
              "[@media(hover:hover)]:hover:border-[color:var(--fg)]",
              "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
              "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
              "[@media(pointer:coarse)]:h-9 [@media(pointer:coarse)]:w-9",
            ].join(" ")}
            aria-label="Pick a custom color"
            title="Pick a custom color"
          >
            <span className="text-[0.7rem] font-bold">+</span>
            <input
              type="color"
              value={value.accentColor}
              onChange={(e) => set("accentColor", e.target.value)}
              className="absolute opacity-0 w-0 h-0"
            />
          </label>
        </div>
      </div>

      <Switch
        label="Shadow"
        description="Soft drop shadow behind caption text for readability on bright footage."
        checked={value.shadow}
        onCheckedChange={(v) => set("shadow", v)}
      />

      <Link
        href={getBlogHref(
          "/blog/brand-consistent-caption-styles",
          "style_controls_guide",
        )}
        className="text-[0.78rem] font-semibold text-[color:var(--accent-ink)]"
      >
        Learn how teams keep caption styles consistent
      </Link>
    </div>
  );
}
