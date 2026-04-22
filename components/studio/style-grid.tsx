"use client";

import { useMemo, useState, type CSSProperties, type FC } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { CAPTION_STYLES, type CaptionStyleId } from "@/lib/types";

type Props = {
  value: CaptionStyleId;
  onChange: (id: CaptionStyleId) => void;
};

const PREVIEW_TEXT = "Make it pop.";
const COLLAPSED_COUNT = 4;

export const StyleGrid: FC<Props> = ({ value, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const visibleStyles = useMemo(() => {
    if (expanded) return CAPTION_STYLES;
    const head = CAPTION_STYLES.slice(0, COLLAPSED_COUNT);
    const selectedInHead = head.some((s) => s.id === value);
    if (selectedInHead) return head;
    const selected = CAPTION_STYLES.find((s) => s.id === value);
    return selected ? [...head.slice(0, COLLAPSED_COUNT - 1), selected] : head;
  }, [expanded, value]);

  const hiddenCount = CAPTION_STYLES.length - COLLAPSED_COUNT;

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]"
        role="radiogroup"
        aria-label="Caption style"
      >
        {visibleStyles.map((style, i) => {
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
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            "group inline-flex items-center justify-center gap-1.5 self-center",
            "h-7 px-3 rounded-full text-[0.7rem] font-medium",
            "text-[color:var(--muted)] bg-[var(--surface-2)]",
            "border border-[color:var(--border)]",
            "transition-[background,color,border-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
            "[@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
            "[@media(hover:hover)]:hover:bg-[var(--surface-1)]",
          )}
        >
          <span className="ital-label normal-case tracking-normal">
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      ) : null}
    </div>
  );
};

const StylePreviewChip: FC<{
  styleId: CaptionStyleId;
  accent: string;
}> = ({ styleId, accent }) => {
  const base: CSSProperties = {
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
    case "comic":
      return (
        <div
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontWeight: 900,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            display: "flex",
            gap: 6,
          }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                color: i === 1 ? "#0b0b0f" : "#fff",
                background: i === 1 ? accent : "transparent",
                border: i === 1 ? "2px solid #0b0b0f" : "none",
                padding: i === 1 ? "2px 6px" : "0",
                borderRadius: 3,
                transform:
                  i === 0
                    ? "rotate(-2deg)"
                    : i === 1
                      ? "rotate(1deg)"
                      : "rotate(-1deg)",
                display: "inline-block",
                WebkitTextStroke: i === 1 ? "0" : "3px #0b0b0f",
                paintOrder: "stroke fill",
                boxShadow: i === 1 ? "2px 2px 0 #0b0b0f" : undefined,
              }}
            >
              {w.replace(/\.$/, "")}
            </span>
          ))}
        </div>
      );
    case "glitch":
      return (
        <div
          style={{
            position: "relative",
            fontFamily: "Orbitron, sans-serif",
            fontSize: 13,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#fff",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              color: "#3af3ff",
              transform: "translate(-2px, 0)",
              mixBlendMode: "screen",
            }}
          >
            {PREVIEW_TEXT}
          </span>
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              color: "#ff3af3",
              transform: "translate(2px, 0)",
              mixBlendMode: "screen",
            }}
          >
            {PREVIEW_TEXT}
          </span>
          <span
            style={{
              position: "relative",
              WebkitTextStroke: "0.75px #0b0b0f",
              paintOrder: "stroke fill",
            }}
          >
            {PREVIEW_TEXT}
          </span>
        </div>
      );
  }
};
