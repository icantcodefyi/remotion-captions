"use client";

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { positionStyles, type CaptionStyleProps } from "./types";

export const TypewriterStyle: React.FC<CaptionStyleProps> = ({ page, options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  // Reveal each character in sync with its token's fromMs -> toMs span.
  let revealed = "";
  for (const token of page.tokens) {
    if (absoluteMs >= token.toMs) {
      revealed += token.text;
      continue;
    }
    if (absoluteMs < token.fromMs) break;
    // In-progress token: reveal characters linearly
    const progress = interpolate(
      absoluteMs,
      [token.fromMs, token.toMs],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    const count = Math.floor(progress * token.text.length);
    revealed += token.text.slice(0, count);
    break;
  }

  const entrance = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });

  const baseSize = 52 * options.fontScale;
  const showCursor = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        ...positionStyles(options.position),
        paddingLeft: "10%",
        paddingRight: "10%",
      }}
    >
      <div
        style={{
          opacity: entrance,
          maxWidth: 1400,
          padding: "20px 28px",
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          borderRadius: 10,
          border: `1px solid ${options.accentColor}33`,
          fontFamily: FONTS.jetbrains,
          fontWeight: 500,
          fontSize: baseSize,
          lineHeight: 1.45,
          color: "#e8e8ea",
          whiteSpace: "pre-wrap",
          textAlign: "left",
          letterSpacing: "0.01em",
        }}
      >
        {revealed}
        <span
          style={{
            display: "inline-block",
            width: "0.6ch",
            height: "1em",
            marginLeft: "2px",
            verticalAlign: "middle",
            background: showCursor ? options.accentColor : "transparent",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
