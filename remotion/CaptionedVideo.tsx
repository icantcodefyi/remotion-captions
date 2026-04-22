"use client";

import { type FC } from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import type { CaptionedVideoProps } from "@/lib/types";
import "./fonts";
import { CaptionOverlay } from "./CaptionOverlay";

export const CaptionedVideo: FC<CaptionedVideoProps> = ({
  videoSrc,
  ...overlayProps
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={videoSrc}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      <CaptionOverlay {...overlayProps} />
    </AbsoluteFill>
  );
};
