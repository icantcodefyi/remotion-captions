"use client";

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { captionFrameStyle, type CaptionStyleProps } from "./types";

export const KaraokeStyle: React.FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const entrance = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  const baseSize = 80 * options.fontScale;

  return (
    <AbsoluteFill>
      <div style={captionFrameStyle(options.position, 84)}>
      <div
        style={{
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 14}px)`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "100%",
          padding: "24px 36px",
          background: "rgba(10,10,15,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          fontFamily: FONTS.inter,
          fontWeight: 700,
          fontSize: baseSize,
          lineHeight: 1.2,
          textAlign: "center",
          whiteSpace: "pre",
          letterSpacing: "-0.01em",
        }}
      >
        {page.tokens.map((token) => {
          const isPast = token.toMs <= absoluteMs;
          const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          const progress = isActive
            ? interpolate(
                absoluteMs,
                [token.fromMs, token.toMs],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )
            : isPast
              ? 1
              : 0;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                position: "relative",
                color: "rgba(255,255,255,0.35)",
                display: "inline-block",
                whiteSpace: "pre",
              }}
            >
              {token.text}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  color: options.accentColor,
                  clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
                  textShadow: `0 0 18px ${options.accentColor}55`,
                }}
              >
                {token.text}
              </span>
            </span>
          );
        })}
      </div>
      </div>
    </AbsoluteFill>
  );
};
