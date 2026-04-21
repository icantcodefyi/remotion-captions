import type { CSSProperties } from "react";
import type { TikTokPage } from "@remotion/captions";
import type { StyleOptions } from "@/lib/types";

export type CaptionStyleProps = {
  page: TikTokPage;
  options: StyleOptions;
  pageIndex: number;
};

export function captionFrameStyle(
  position: StyleOptions["position"],
  widthPct = 88,
): CSSProperties {
  return {
    position: "absolute",
    top: `${position.y * 100}%`,
    left: `${position.x * 100}%`,
    transform: "translate(-50%, -50%)",
    width: `${widthPct}%`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };
}
