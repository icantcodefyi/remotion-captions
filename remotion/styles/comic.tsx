"use client";

import { type FC } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "../fonts";
import { captionFrameStyle, type CaptionStyleProps } from "./types";

export const ComicStyle: FC<CaptionStyleProps> = ({ page, options, pageIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const pop = spring({
    frame,
    fps,
    config: { damping: 9, mass: 0.5, stiffness: 160 },
  });

  const baseSize = 120 * options.fontScale;

  return (
    <AbsoluteFill>
      <div style={captionFrameStyle(options.position, 90)}>
        <div
          style={{
            transform: `scale(${0.6 + pop * 0.4}) rotate(${(pageIndex % 2 === 0 ? -1 : 1) * (1 - pop) * 4}deg)`,
            opacity: interpolate(frame, [0, 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px 16px",
            maxWidth: "100%",
            fontFamily: FONTS.poppins,
            fontWeight: 900,
            fontSize: baseSize,
            lineHeight: 1,
            textAlign: "center",
            whiteSpace: "pre",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          {page.tokens.map((token, tIdx) => {
            const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
            const trimmed = token.text.trim();
            if (trimmed.length === 0) return null;
            const tilt = ((tIdx % 2) === 0 ? -1 : 1) * (2 + (tIdx % 3));
            return (
              <span
                key={`${token.fromMs}-${token.text}`}
                style={{
                  color: isActive ? "#0b0b0f" : "#fff",
                  background: isActive ? options.accentColor : "transparent",
                  padding: isActive ? "6px 16px 4px" : "0",
                  borderRadius: 6,
                  display: "inline-block",
                  transform: `rotate(${isActive ? tilt / 2 : tilt}deg) ${isActive ? "scale(1.08)" : "scale(1)"}`,
                  border: isActive ? "4px solid #0b0b0f" : "none",
                  WebkitTextStroke: isActive ? "0" : "6px #0b0b0f",
                  paintOrder: "stroke fill",
                  textShadow: !isActive && options.shadow
                    ? "4px 4px 0 rgba(0,0,0,0.9)"
                    : undefined,
                  boxShadow: isActive
                    ? "4px 4px 0 #0b0b0f, 0 10px 22px rgba(0,0,0,0.3)"
                    : undefined,
                }}
              >
                {trimmed}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
