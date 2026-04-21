"use client";

import * as React from "react";
import { Player } from "@remotion/player";
import { CaptionedVideo } from "@/remotion/CaptionedVideo";
import type { CaptionedVideoProps } from "@/lib/types";

type Props = {
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  inputProps: CaptionedVideoProps;
};

export const PreviewPlayer: React.FC<Props> = ({
  durationInFrames,
  fps,
  compositionWidth,
  compositionHeight,
  inputProps,
}) => {
  return (
    <Player
      component={CaptionedVideo}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      controls
      loop
      clickToPlay
      acknowledgeRemotionLicense
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  );
};
