"use client";

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { positionStyles, type CaptionStyleProps } from "./types";

export const TikTokStyle: React.FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const entrance = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  const baseSize = 110 * options.fontScale;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        ...positionStyles(options.position),
        paddingLeft: "6%",
        paddingRight: "6%",
      }}
    >
      <div
        style={{
          transform: `scale(${entrance}) translateY(${(1 - entrance) * 30}px)`,
          opacity: entrance,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "92%",
          fontFamily: FONTS.poppins,
          fontWeight: 900,
          fontSize: baseSize,
          lineHeight: 1.05,
          textAlign: "center",
          whiteSpace: "pre",
          letterSpacing: "-0.02em",
        }}
      >
        {page.tokens.map((token) => {
          const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                color: isActive ? options.accentColor : "#fff",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                display: "inline-block",
                transformOrigin: "center bottom",
                transition: "none",
                WebkitTextStroke: "3px #000",
                paintOrder: "stroke fill",
                textShadow: options.shadow
                  ? "0 6px 18px rgba(0,0,0,0.55)"
                  : undefined,
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
