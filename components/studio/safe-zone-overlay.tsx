"use client";

import { type FC } from "react";
import { getAspectPreset, type AspectPresetId } from "@/lib/aspect";

type Props = {
  aspectId: AspectPresetId;
};

/**
 * Quiet dashed bands showing where platform UI (TikTok caption & rail, Shorts
 * button stack) will cover the video. Drawn inside the canvas box, above the
 * player but under the caption-drag handle. Hidden for "source" — there's no
 * platform target to reason about.
 */
export const SafeZoneOverlay: FC<Props> = ({ aspectId }) => {
  const preset = getAspectPreset(aspectId);
  if (aspectId === "source") return null;

  const topPct = preset.safeTop * 100;
  const bottomPct = preset.safeBottom * 100;

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <Band style={{ top: 0, height: `${topPct}%` }} label="safe zone" />
      <Band
        style={{ bottom: 0, height: `${bottomPct}%` }}
        label="keep clear"
        anchor="bottom"
      />
    </div>
  );
};

const Band: FC<{
  style: React.CSSProperties;
  label: string;
  anchor?: "top" | "bottom";
}> = ({ style, label, anchor = "top" }) => (
  <div
    className="absolute left-0 right-0"
    style={{
      ...style,
      background:
        "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 12px)",
      borderTop: anchor === "bottom" ? "1px dashed rgba(255,255,255,0.28)" : undefined,
      borderBottom: anchor === "top" ? "1px dashed rgba(255,255,255,0.28)" : undefined,
    }}
  >
    <span
      className="ital-label absolute left-2 text-[0.62rem] tracking-[0.18em]"
      style={{
        color: "rgba(255,255,255,0.65)",
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        [anchor === "top" ? "bottom" : "top"]: "4px",
      }}
    >
      {label}
    </span>
  </div>
);
