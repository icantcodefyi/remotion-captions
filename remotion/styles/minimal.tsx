"use client";

import { type FC } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { captionFrameStyle, type CaptionStyleProps } from "./types";

export const MinimalStyle: FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const entrance = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const baseSize = 56 * options.fontScale;

  return (
    <AbsoluteFill>
      <div style={captionFrameStyle(options.position, 80)}>
      <div
        style={{
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 10}px)`,
          maxWidth: 1400,
          fontFamily: FONTS.dmSans,
          fontWeight: 500,
          fontSize: baseSize,
          lineHeight: 1.32,
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
          whiteSpace: "pre-wrap",
          textShadow: options.shadow
            ? "0 2px 24px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.8)"
            : undefined,
          letterSpacing: "-0.005em",
        }}
      >
        {page.tokens.map((token) => {
          const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                color: isActive ? options.accentColor : "rgba(255,255,255,0.95)",
                whiteSpace: "pre",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
      </div>
    </AbsoluteFill>
  );
};
