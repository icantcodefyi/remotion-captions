"use client";

import type { CSSProperties } from "react";
import { FONTS } from "@/remotion/fonts";
import type { CaptionStyleId, StyleOptions } from "@/lib/types";

/**
 * Cap the inline-edit block at the style's caption frame width (matches the
 * `widthPct` arg each Remotion style passes to `captionFrameStyle`).
 */
const FRAME_WIDTH_PCT: Record<CaptionStyleId, number> = {
  tiktok: 88,
  hormozi: 92,
  beast: 90,
  comic: 90,
  karaoke: 84,
  minimal: 80,
  neon: 88,
  glitch: 88,
  broadcast: 88,
  typewriter: 80,
};

/**
 * Base font size (composition pixels) that each Remotion style uses before
 * multiplying by `options.fontScale`.
 */
const BASE_SIZE: Record<CaptionStyleId, number> = {
  tiktok: 110,
  hormozi: 130,
  beast: 120,
  comic: 120,
  karaoke: 80,
  minimal: 56,
  neon: 100,
  glitch: 92,
  broadcast: 48,
  typewriter: 52,
};

/**
 * Inline editor's positioning zone width (see `buildZoneStyle` in
 * caption-inline-editor.tsx). Stays fixed regardless of style so the cqw
 * conversion below is consistent.
 */
const ZONE_WIDTH_PCT = 92;

export type InlineCaptionAppearance = {
  /** Max width of the editable block within the zone (matches Remotion frame). */
  frameWidthPct: number;
  /** Applied to the contenteditable element itself. */
  textStyle: CSSProperties;
  /** Optional wrapper that sits between the zone and the editable text
   *  (used by styles that have a box/background, e.g. Broadcast, Typewriter, Karaoke). */
  wrapperStyle?: CSSProperties;
  /** Rendered to the left of the editable text (Broadcast accent bar). */
  leadingDecoration?: "broadcast-bar";
  /** Alignment of the editable text inside the wrapper. */
  textAlign: CSSProperties["textAlign"];
};

/**
 * Maps composition-space `px` to container-query `cqw` on the 92%-wide
 * inline editor zone so text renders at the same displayed size as Remotion.
 */
function cqw(compPx: number, compositionWidth: number): string {
  const value = (compPx * 10000) / (compositionWidth * ZONE_WIDTH_PCT);
  return `${value.toFixed(3)}cqw`;
}

export function getInlineCaptionAppearance(
  styleId: CaptionStyleId,
  options: StyleOptions,
  compositionWidth: number,
): InlineCaptionAppearance {
  const frameWidthPct = FRAME_WIDTH_PCT[styleId];
  const baseSizePx = BASE_SIZE[styleId] * options.fontScale;
  const fontSize = cqw(baseSizePx, compositionWidth);
  const accent = options.accentColor;

  switch (styleId) {
    case "tiktok":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.poppins,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "#fff",
          WebkitTextStroke: `${cqw(3, compositionWidth)} #000`,
          paintOrder: "stroke fill",
          textShadow: options.shadow
            ? "0 6px 18px rgba(0,0,0,0.55)"
            : undefined,
          textAlign: "center",
        },
      };

    case "hormozi":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.anton,
          fontWeight: 400,
          fontSize,
          lineHeight: 1,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          color: "#fff",
          WebkitTextStroke: `${cqw(4, compositionWidth)} #000`,
          paintOrder: "stroke fill",
          textShadow: options.shadow
            ? "0 6px 20px rgba(0,0,0,0.7)"
            : undefined,
          textAlign: "center",
        },
      };

    case "beast":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.poppins,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "#fff",
          WebkitTextStroke: `${cqw(4, compositionWidth)} #101015`,
          paintOrder: "stroke fill",
          textShadow: options.shadow
            ? `0 0 30px ${accent}55, 0 8px 18px rgba(0,0,0,0.55)`
            : undefined,
          textAlign: "center",
        },
      };

    case "comic":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.poppins,
          fontWeight: 900,
          fontSize,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          textTransform: "uppercase",
          color: "#fff",
          WebkitTextStroke: `${cqw(6, compositionWidth)} #0b0b0f`,
          paintOrder: "stroke fill",
          textShadow: options.shadow
            ? "4px 4px 0 rgba(0,0,0,0.9)"
            : undefined,
          textAlign: "center",
        },
      };

    case "karaoke":
      return {
        frameWidthPct,
        textAlign: "center",
        wrapperStyle: {
          padding: `${cqw(24, compositionWidth)} ${cqw(36, compositionWidth)}`,
          background: "rgba(10,10,15,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
        },
        textStyle: {
          fontFamily: FONTS.inter,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
        },
      };

    case "minimal":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.dmSans,
          fontWeight: 500,
          fontSize,
          lineHeight: 1.32,
          letterSpacing: "-0.005em",
          color: "rgba(255,255,255,0.95)",
          textShadow: options.shadow
            ? "0 2px 24px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.8)"
            : undefined,
          textAlign: "center",
        },
      };

    case "neon":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.orbitron,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.1,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "#fff",
          textShadow: `0 0 2px #fff, 0 0 8px ${accent}88, 0 0 18px ${accent}55`,
          textAlign: "center",
        },
      };

    case "glitch":
      return {
        frameWidthPct,
        textAlign: "center",
        textStyle: {
          fontFamily: FONTS.orbitron,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.05,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#fff",
          WebkitTextStroke: `${cqw(1.5, compositionWidth)} #0b0b0f`,
          paintOrder: "stroke fill",
          textShadow: options.shadow
            ? "0 4px 16px rgba(0,0,0,0.55)"
            : undefined,
          textAlign: "center",
        },
      };

    case "broadcast":
      return {
        frameWidthPct,
        textAlign: "left",
        leadingDecoration: "broadcast-bar",
        wrapperStyle: {
          background: "rgba(12,12,18,0.92)",
          padding: `${cqw(18, compositionWidth)} ${cqw(28, compositionWidth)}`,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        },
        textStyle: {
          fontFamily: FONTS.inter,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.25,
          letterSpacing: "-0.005em",
          color: "#fff",
          textAlign: "left",
        },
      };

    case "typewriter":
      return {
        frameWidthPct,
        textAlign: "left",
        wrapperStyle: {
          padding: `${cqw(20, compositionWidth)} ${cqw(28, compositionWidth)}`,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          borderRadius: 10,
          border: `1px solid ${accent}33`,
        },
        textStyle: {
          fontFamily: FONTS.jetbrains,
          fontWeight: 500,
          fontSize,
          lineHeight: 1.45,
          letterSpacing: "0.01em",
          color: "#e8e8ea",
          textAlign: "left",
        },
      };
  }
}
