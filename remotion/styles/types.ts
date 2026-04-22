import type { CSSProperties } from "react";
import type { TikTokPage } from "@remotion/captions";
import type { StyleOptions } from "@/lib/types";

export type CaptionStyleProps = {
  page: TikTokPage;
  options: StyleOptions;
  pageIndex: number;
};

/**
 * Anchors the caption to the nearest edge based on position.y so that long,
 * multi-line captions grow toward the interior of the video instead of
 * overflowing the frame. Also caps max-height to the available safe area
 * and enforces word wrapping so a single long token can't overflow horizontally.
 */
export function captionFrameStyle(
  position: StyleOptions["position"],
  widthPct = 88,
): CSSProperties {
  const y = position.y;
  const safePadPct = 4;

  let translateY: string;
  let maxHeight: string;
  let justify: CSSProperties["justifyContent"];

  if (y >= 0.6) {
    // Bottom region — caption's bottom edge aligns at y, content grows upward
    translateY = "-100%";
    maxHeight = `calc(${(y * 100).toFixed(2)}% - ${safePadPct}%)`;
    justify = "flex-end";
  } else if (y <= 0.4) {
    // Top region — caption's top edge aligns at y, content grows downward
    translateY = "0%";
    maxHeight = `calc(${((1 - y) * 100).toFixed(2)}% - ${safePadPct}%)`;
    justify = "flex-start";
  } else {
    // Middle — centered, bounded by the nearer edge
    translateY = "-50%";
    const half = Math.min(y, 1 - y) * 100;
    maxHeight = `calc(${(half * 2).toFixed(2)}% - ${safePadPct}%)`;
    justify = "center";
  }

  return {
    position: "absolute",
    top: `${position.y * 100}%`,
    left: `${position.x * 100}%`,
    transform: `translate(-50%, ${translateY})`,
    width: `${widthPct}%`,
    maxWidth: `${widthPct}%`,
    maxHeight,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: justify,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };
}
