"use client";

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { positionStyles, type CaptionStyleProps } from "./types";

export const HormoziStyle: React.FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const entrance = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const baseSize = 130 * options.fontScale;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        ...positionStyles(options.position),
        padding: "0 4%",
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - entrance) * 40}px)`,
          opacity: entrance,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 14px",
          maxWidth: "96%",
          fontFamily: FONTS.anton,
          fontWeight: 400,
          fontSize: baseSize,
          lineHeight: 1,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.01em",
        }}
      >
        {page.tokens.map((token) => {
          const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          const trimmed = token.text.trim();
          if (trimmed.length === 0) return null;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                color: isActive ? "#0d0d0d" : "#ffffff",
                background: isActive ? options.accentColor : "transparent",
                padding: isActive ? "6px 18px 2px" : "0",
                borderRadius: isActive ? 12 : 0,
                display: "inline-block",
                transform: isActive ? "scale(1.08) rotate(-1deg)" : "scale(1)",
                transformOrigin: "center",
                WebkitTextStroke: isActive ? "0" : "4px #000",
                paintOrder: "stroke fill",
                textShadow: !isActive && options.shadow
                  ? "0 6px 20px rgba(0,0,0,0.7)"
                  : undefined,
                boxShadow: isActive
                  ? "0 8px 30px rgba(0,0,0,0.45), 0 2px 0 rgba(0,0,0,0.3)"
                  : undefined,
              }}
            >
              {trimmed}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
