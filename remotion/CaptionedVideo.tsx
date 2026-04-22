"use client";

import { type FC, useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { CaptionedVideoProps } from "@/lib/types";
import { STYLE_REGISTRY } from "./styles";
import "./fonts";

export const CaptionedVideo: FC<CaptionedVideoProps> = ({
  videoSrc,
  captions,
  styleId,
  styleOptions,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const StyleComponent = STYLE_REGISTRY[styleId];

  // Pages group consecutive tokens into caption chunks. We roughly map
  // "words per page" to a milliseconds-per-page value by assuming
  // an average word duration of 350ms (will be tuned by real data anyway).
  const combineMs = Math.max(400, Math.round(styleOptions.wordsPerPage * 380));

  const { pages } = useMemo(() => {
    if (!captions || captions.length === 0) return { pages: [] };
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: combineMs,
    });
  }, [captions, combineMs]);

  const totalDurationMs = (durationInFrames / fps) * 1000;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={videoSrc}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.max(0, Math.floor((page.startMs / 1000) * fps));
        const nextStartMs = nextPage ? nextPage.startMs : totalDurationMs;
        const endMs = Math.min(
          nextStartMs,
          page.startMs + Math.max(page.durationMs, combineMs),
        );
        const endFrame = Math.min(
          Math.ceil((endMs / 1000) * fps),
          durationInFrames,
        );
        const duration = endFrame - startFrame;
        if (duration <= 0) return null;

        return (
          <Sequence
            key={`${index}-${page.startMs}`}
            from={startFrame}
            durationInFrames={duration}
            premountFor={fps}
          >
            <StyleComponent page={page} options={styleOptions} pageIndex={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
