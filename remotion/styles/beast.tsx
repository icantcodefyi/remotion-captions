"use client";

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { positionStyles, type CaptionStyleProps } from "./types";

const BEAST_PALETTE = [
  "#FF3D7F",
  "#FFD54A",
  "#39E508",
  "#4FC3F7",
  "#C4B5FD",
  "#FF914D",
];

export const BeastStyle: React.FC<CaptionStyleProps> = ({ page, options, pageIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const bounce = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 140 },
  });

  const pageAccent = BEAST_PALETTE[pageIndex % BEAST_PALETTE.length];
  const baseSize = 120 * options.fontScale;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        ...positionStyles(options.position),
        paddingLeft: "5%",
        paddingRight: "5%",
      }}
    >
      <div
        style={{
          transform: `scale(${0.6 + bounce * 0.4}) translateY(${
            (1 - bounce) * 50
          }px)`,
          opacity: interpolate(frame, [0, 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "90%",
          fontFamily: FONTS.poppins,
          fontWeight: 900,
          fontSize: baseSize,
          lineHeight: 1.05,
          textAlign: "center",
          whiteSpace: "pre",
          letterSpacing: "-0.02em",
        }}
      >
        {page.tokens.map((token, tIdx) => {
          const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
          const accent = BEAST_PALETTE[(pageIndex + tIdx) % BEAST_PALETTE.length];
          const wobble =
            Math.sin((frame + tIdx * 10) / 6) * (isActive ? 6 : 2);
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                color: isActive ? accent : "#fff",
                transform: `translateY(${wobble}px) ${
                  isActive ? "scale(1.12)" : "scale(1)"
                }`,
                display: "inline-block",
                transformOrigin: "center bottom",
                WebkitTextStroke: "4px #101015",
                paintOrder: "stroke fill",
                textShadow: options.shadow
                  ? `0 0 30px ${pageAccent}55, 0 8px 18px rgba(0,0,0,0.55)`
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

