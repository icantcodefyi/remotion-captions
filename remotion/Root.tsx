import { Composition } from "remotion";
import { CaptionedVideo } from "./CaptionedVideo";
import {
  DEFAULT_STYLE_OPTIONS,
  type CaptionedVideoProps,
} from "@/lib/types";

export type RenderInputProps = CaptionedVideoProps & {
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
};

function RenderableCaptionedVideo({
  videoSrc,
  captions,
  styleId,
  styleOptions,
}: RenderInputProps) {
  return (
    <CaptionedVideo
      videoSrc={videoSrc}
      captions={captions}
      styleId={styleId}
      styleOptions={styleOptions}
    />
  );
}

const FALLBACK_PROPS: RenderInputProps = {
  videoSrc: "",
  captions: [],
  styleId: "tiktok",
  styleOptions: DEFAULT_STYLE_OPTIONS,
  width: 1080,
  height: 1920,
  durationInFrames: 30,
  fps: 30,
};

export function RemotionRoot() {
  return (
    <Composition
      id="captioned-video"
      component={RenderableCaptionedVideo}
      defaultProps={FALLBACK_PROPS}
      fps={FALLBACK_PROPS.fps}
      width={FALLBACK_PROPS.width}
      height={FALLBACK_PROPS.height}
      durationInFrames={FALLBACK_PROPS.durationInFrames}
      calculateMetadata={({ props }) => ({
        width: props.width,
        height: props.height,
        durationInFrames: Math.max(1, Math.round(props.durationInFrames)),
        fps: props.fps,
        props,
      })}
    />
  );
}
