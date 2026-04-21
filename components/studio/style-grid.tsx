"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CAPTION_STYLES, type CaptionStyleId } from "@/lib/types";

type Props = {
  value: CaptionStyleId;
  onChange: (id: CaptionStyleId) => void;
};

const PREVIEW_TEXT = "Make it pop.";

export const StyleGrid: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div
      className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]"
      role="radiogroup"
      aria-label="Caption style"
    >
      {CAPTION_STYLES.map((style, i) => {
        const selected = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(style.id)}
            style={{ ["--i" as string]: i }}
            className={cn(
              "group relative text-left rounded-xl overflow-hidden border fade-rise",
              "transition-[transform,border-color,box-shadow] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]",
              selected
                ? "border-[color:var(--accent)] shadow-[0_0_0_3px_var(--accent-glow),0_8px_22px_-12px_var(--accent-glow)] -translate-y-[1px]"
                : [
                    "border-[color:var(--border)]",
                    "[@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
                    "[@media(hover:hover)]:hover:-translate-y-[1px]",
                    "[@media(hover:hover)]:hover:shadow-[var(--shadow-lift)]",
                  ].join(" "),
            )}
          >
            <div
              className="aspect-[16/10] flex items-end p-3 relative"
              style={{ background: style.previewBackground }}
            >
              <StylePreviewChip
                styleId={style.id}
                accent={style.defaultAccent}
              />
              {selected && (
                <div
                  className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-deep)",
                    boxShadow:
                      "0 0 14px var(--accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.35)",
                  }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}
            </div>
            <div
              className="px-3 py-2.5"
              style={{
                background: "var(--surface-1)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div className="text-[0.75rem] font-semibold text-[color:var(--fg)]">
                {style.name}
              </div>
              <div className="text-[0.7rem] text-[color:var(--muted)] truncate mt-0.5 ital-label">
                {style.tagline}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const StylePreviewChip: React.FC<{
  styleId: CaptionStyleId;
  accent: string;
}> = ({ styleId, accent }) => {
  const base: React.CSSProperties = {
    display: "inline-block",
    fontWeight: 900,
    fontSize: 14,
    lineHeight: 1,
    color: "#fff",
  };
  const words = PREVIEW_TEXT.split(" ");

  switch (styleId) {
    case "tiktok":
      return (
        <div style={{ ...base, textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                color: i === 1 ? accent : "#fff",
                WebkitTextStroke: "1.5px #000",
                paintOrder: "stroke fill",
                marginRight: 4,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      );
    case "hormozi":
      return (
        <div
          style={{
            fontFamily: "Impact, sans-serif",
            ...base,
            fontSize: 18,
            textTransform: "uppercase",
          }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                background: i === 1 ? accent : "transparent",
                color: i === 1 ? "#000" : "#fff",
                padding: i === 1 ? "1px 5px" : "0",
                borderRadius: 4,
                marginRight: 4,
                WebkitTextStroke: i === 1 ? "0" : "1.5px #000",
                paintOrder: "stroke fill",
                display: "inline-block",
              }}
            >
              {w}
            </span>
          ))}
        </div>
      );
    case "beast":
      return (
        <div style={{ ...base, letterSpacing: "-0.02em" }}>
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                color: i === 0 ? "#FFD54A" : i === 1 ? "#FF3D7F" : "#4FC3F7",
                WebkitTextStroke: "1.5px #101015",
                paintOrder: "stroke fill",
                marginRight: 4,
                display: "inline-block",
                transform: i === 1 ? "rotate(-3deg)" : "rotate(0)",
              }}
            >
              {w}
            </span>
          ))}
        </div>
      );
    case "karaoke":
      return (
        <div
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 10px",
            background: "rgba(10,10,15,0.65)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <span style={{ color: accent }}>Make</span>
          <span> it pop.</span>
        </div>
      );
    case "minimal":
      return (
        <div
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 1px 8px rgba(0,0,0,0.6)",
          }}
        >
          {PREVIEW_TEXT}
        </div>
      );
    case "neon":
      return (
        <div
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: 13,
            fontWeight: 900,
            textTransform: "uppercase",
            color: "#fff",
            letterSpacing: "0.06em",
            textShadow: `0 0 3px #fff, 0 0 8px ${accent}, 0 0 16px ${accent}`,
          }}
        >
          {PREVIEW_TEXT}
        </div>
      );
    case "typewriter":
      return (
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 8px",
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${accent}44`,
            borderRadius: 4,
            color: "#e8e8ea",
          }}
        >
          Make it p
          <span
            style={{
              display: "inline-block",
              width: "0.55ch",
              height: "1em",
              background: accent,
              verticalAlign: "middle",
              marginLeft: 1,
            }}
          />
        </div>
      );
    case "broadcast":
      return (
        <div style={{ display: "flex" }}>
          <div style={{ width: 4, background: accent }} />
          <div
            style={{
              background: "rgba(12,12,18,0.92)",
              padding: "4px 8px",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {PREVIEW_TEXT}
          </div>
        </div>
      );
  }
};
