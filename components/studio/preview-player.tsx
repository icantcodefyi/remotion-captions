"use client";

import { type Ref } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { CaptionedVideo } from "@/remotion/CaptionedVideo";
import type { CaptionedVideoProps } from "@/lib/types";

type Props = {
  ref?: Ref<PlayerRef>;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  inputProps: CaptionedVideoProps;
};

export function PreviewPlayer({
  ref,
  durationInFrames,
  fps,
  compositionWidth,
  compositionHeight,
  inputProps,
}: Props) {
  return (
    <Player
      ref={ref}
      component={CaptionedVideo}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      controls
      loop
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
}
