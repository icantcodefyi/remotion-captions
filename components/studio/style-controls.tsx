"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { SectionLabel } from "@/components/ui/label";
import type { CaptionPosition, StyleOptions } from "@/lib/types";

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

export const StyleControls: React.FC<Props> = ({ value, onChange }) => {
  const set = <K extends keyof StyleOptions>(key: K, v: StyleOptions[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionLabel className="mb-2">Position</SectionLabel>
        <Segmented<CaptionPosition>
          value={value.position}
          onChange={(v) => set("position", v)}
          size="sm"
          className="w-full"
          options={[
            { value: "top", label: "Top" },
            { value: "center", label: "Center" },
            { value: "bottom", label: "Bottom" },
          ]}
        />
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

      <div>
        <SectionLabel className="mb-2">Accent color</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("accentColor", c)}
              className="h-7 w-7 rounded-full border border-[var(--color-border-strong)] transition-all hover:scale-110 relative"
              style={{
                background: c,
                boxShadow:
                  value.accentColor === c
                    ? `0 0 0 2px var(--color-background), 0 0 0 4px ${c}`
                    : undefined,
              }}
              aria-label={`Accent ${c}`}
            />
          ))}
          <label
            className="h-7 w-7 rounded-full border border-dashed border-[var(--color-border-strong)] flex items-center justify-center cursor-pointer hover:border-[var(--color-foreground)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            aria-label="Custom color"
          >
            <span className="text-[10px] font-bold">+</span>
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
        description="Drop shadow under text for readability"
        checked={value.shadow}
        onCheckedChange={(v) => set("shadow", v)}
      />
    </div>
  );
};
