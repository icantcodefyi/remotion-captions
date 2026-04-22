"use client";

import { type FC } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { captionFrameStyle, type CaptionStyleProps } from "./types";

export const NeonStyle: FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const entrance = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const flicker = 0.92 + 0.08 * Math.sin(frame / 3);

  const baseSize = 100 * options.fontScale;

  return (
    <AbsoluteFill>
      <div style={captionFrameStyle(options.position, 88)}>
      <div
        style={{
          opacity: entrance * flicker,
          transform: `translateY(${(1 - entrance) * 20}px)`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "100%",
          fontFamily: FONTS.orbitron,
          fontWeight: 900,
          fontSize: baseSize,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          textAlign: "center",
          whiteSpace: "pre",
          color: "#fff",
        }}
      >
        {page.tokens.map((token) => {
          const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          const c = options.accentColor;
          const glow = isActive
            ? `0 0 4px #fff, 0 0 14px ${c}, 0 0 28px ${c}, 0 0 52px ${c}`
            : `0 0 2px #fff, 0 0 8px ${c}88, 0 0 18px ${c}55`;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                textShadow: glow,
                transform: isActive ? "scale(1.05)" : "scale(1)",
                display: "inline-block",
                transformOrigin: "center",
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
