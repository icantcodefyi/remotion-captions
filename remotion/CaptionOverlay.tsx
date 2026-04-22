"use client";

import { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { CaptionOverlayProps } from "@/lib/types";
import { getCaptionPages } from "@/lib/caption-render";
import { STYLE_REGISTRY } from "./styles";

export function CaptionOverlay({
  captions,
  styleId,
  styleOptions,
}: CaptionOverlayProps) {
  const { fps, durationInFrames } = useVideoConfig();
  const StyleComponent = STYLE_REGISTRY[styleId];

  const { pages, combineMs } = useMemo(
    () => getCaptionPages(captions, styleOptions.wordsPerPage),
    [captions, styleOptions.wordsPerPage],
  );

  const totalDurationMs = (durationInFrames / fps) * 1000;

  return (
    <AbsoluteFill
      data-export-overlay-root
      style={{ backgroundColor: "transparent", pointerEvents: "none" }}
    >
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
        const sequenceDuration = endFrame - startFrame;

        if (sequenceDuration <= 0) return null;

        return (
          <Sequence
            key={`${index}-${page.startMs}`}
            from={startFrame}
            durationInFrames={sequenceDuration}
            premountFor={fps}
          >
            <StyleComponent page={page} options={styleOptions} pageIndex={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
