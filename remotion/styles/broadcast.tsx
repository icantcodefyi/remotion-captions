"use client";

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { captionFrameStyle, type CaptionStyleProps } from "./types";

export const BroadcastStyle: React.FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const slide = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const baseSize = 48 * options.fontScale;

  return (
    <AbsoluteFill>
      <div style={captionFrameStyle(options.position, 88)}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          maxWidth: "100%",
          transform: `translateX(${(1 - slide) * -80}px)`,
          opacity: slide,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 14,
            background: options.accentColor,
          }}
        />
        <div
          style={{
            background: "rgba(12,12,18,0.92)",
            padding: "18px 28px",
            fontFamily: FONTS.inter,
            fontWeight: 700,
            fontSize: baseSize,
            lineHeight: 1.25,
            color: "#fff",
            letterSpacing: "-0.005em",
            whiteSpace: "pre-wrap",
            borderRight: `1px solid rgba(255,255,255,0.06)`,
          }}
        >
          {page.tokens.map((token) => {
            const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
            return (
              <span
                key={`${token.fromMs}-${token.text}`}
                style={{
                  color: isActive ? options.accentColor : "#fff",
                  whiteSpace: "pre",
                }}
              >
                {token.text}
              </span>
            );
          })}
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};
