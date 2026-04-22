"use client";

import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "../fonts";
import { captionFrameStyle, type CaptionStyleProps } from "./types";

export function GlitchStyle({ page, options }: CaptionStyleProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteMs = page.startMs + currentTimeMs;

  const entrance = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Bursts of jitter — mostly calm, occasionally snappy.
  const jitterSeed = Math.floor(frame / 3);
  const jitterWindow = jitterSeed % 7 === 0 ? 1 : 0.15;
  const rx = (pseudo(jitterSeed) - 0.5) * 8 * jitterWindow;
  const ry = (pseudo(jitterSeed + 1) - 0.5) * 4 * jitterWindow;

  const baseSize = 92 * options.fontScale;

  return (
    <AbsoluteFill>
      <div style={captionFrameStyle(options.position, 88)}>
        <div
          style={{
            opacity: entrance,
            transform: `translate(${rx}px, ${(1 - entrance) * 14 + ry}px)`,
            position: "relative",
            fontFamily: FONTS.orbitron,
            fontWeight: 900,
            fontSize: baseSize,
            lineHeight: 1.05,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            textAlign: "center",
            whiteSpace: "pre-wrap",
            color: "#fff",
            maxWidth: "100%",
          }}
        >
          {/* Cyan ghost */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              color: "#3af3ff",
              transform: `translate(${-3 - rx * 0.4}px, 0)`,
              mixBlendMode: "screen",
              opacity: 0.85,
            }}
          >
            {renderTokens(page, absoluteMs, "#3af3ff")}
          </div>
          {/* Magenta ghost */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              color: "#ff3af3",
              transform: `translate(${3 + rx * 0.4}px, 0)`,
              mixBlendMode: "screen",
              opacity: 0.85,
            }}
          >
            {renderTokens(page, absoluteMs, "#ff3af3")}
          </div>
          {/* Core */}
          <div
            style={{
              position: "relative",
              WebkitTextStroke: "1.5px #0b0b0f",
              paintOrder: "stroke fill",
              textShadow: options.shadow
                ? "0 4px 16px rgba(0,0,0,0.55)"
                : undefined,
            }}
          >
            {renderTokens(page, absoluteMs, "#fff", options.accentColor)}
          </div>
          {/* Scanlines */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "-4px",
              pointerEvents: "none",
              background:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0.25) 0 2px, transparent 2px 4px)",
              mixBlendMode: "multiply",
              opacity: 0.35,
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function renderTokens(
  page: CaptionStyleProps["page"],
  absoluteMs: number,
  defaultColor: string,
  activeColor?: string,
) {
  return page.tokens.map((token) => {
    const isActive = token.fromMs <= absoluteMs && token.toMs > absoluteMs;
    return (
      <span
        key={`${token.fromMs}-${token.text}`}
        style={{
          color: isActive && activeColor ? activeColor : defaultColor,
        }}
      >
        {token.text}
      </span>
    );
  });
}

function pseudo(n: number) {
  const x = Math.sin(n * 91.37) * 10000;
  return x - Math.floor(x);
}
