import type { Caption } from "@remotion/captions";

export type { Caption };

export type CaptionStyleId =
  | "tiktok"
  | "hormozi"
  | "beast"
  | "karaoke"
  | "minimal"
  | "neon"
  | "typewriter"
  | "broadcast"
  | "comic"
  | "glitch";

export type CaptionPosition = { x: number; y: number };

export type StyleOptions = {
  position: CaptionPosition;
  fontScale: number;
  wordsPerPage: number;
  accentColor: string;
  shadow: boolean;
};

export type CaptionOverlayProps = {
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
};

export const DEFAULT_STYLE_OPTIONS: StyleOptions = {
  position: { x: 0.5, y: 0.85 },
  fontScale: 1,
  wordsPerPage: 3,
  accentColor: "#C4FF3D",
  shadow: true,
};

export const POSITION_PRESETS: { id: "top" | "center" | "bottom"; label: string; value: CaptionPosition }[] = [
  { id: "top", label: "Top", value: { x: 0.5, y: 0.12 } },
  { id: "center", label: "Center", value: { x: 0.5, y: 0.5 } },
  { id: "bottom", label: "Bottom", value: { x: 0.5, y: 0.85 } },
];

export const POSITION_CLAMP = { minX: 0.15, maxX: 0.85, minY: 0.05, maxY: 0.95 };

export type CaptionStyleMeta = {
  id: CaptionStyleId;
  name: string;
  tagline: string;
  defaultWordsPerPage: number;
  defaultAccent: string;
  previewBackground: string;
};

export const CAPTION_STYLES: CaptionStyleMeta[] = [
  {
    id: "tiktok",
    name: "TikTok",
    tagline: "Bold word-by-word pops",
    defaultWordsPerPage: 3,
    defaultAccent: "#39E508",
    previewBackground:
      "linear-gradient(135deg,#111 0%,#2b1a4a 60%,#6b1a6b 100%)",
  },
  {
    id: "hormozi",
    name: "Hormozi",
    tagline: "Huge emphasis words, yellow highlight",
    defaultWordsPerPage: 4,
    defaultAccent: "#FFD54A",
    previewBackground:
      "linear-gradient(135deg,#0d0d0d 0%,#222 100%)",
  },
  {
    id: "beast",
    name: "Beast",
    tagline: "Playful bounce, rainbow accents",
    defaultWordsPerPage: 2,
    defaultAccent: "#FF3D7F",
    previewBackground:
      "linear-gradient(135deg,#090909 0%,#12233a 60%,#1a3d6b 100%)",
  },
  {
    id: "comic",
    name: "Comic",
    tagline: "Ink outline, playful tilt",
    defaultWordsPerPage: 2,
    defaultAccent: "#FFC940",
    previewBackground:
      "repeating-linear-gradient(45deg,#ffe37a 0 18px,#ffd54a 18px 36px)",
  },
  {
    id: "karaoke",
    name: "Karaoke",
    tagline: "Classic word fill",
    defaultWordsPerPage: 6,
    defaultAccent: "#4FC3F7",
    previewBackground:
      "linear-gradient(135deg,#0a0a0a 0%,#1a1a2f 100%)",
  },
  {
    id: "minimal",
    name: "Minimal",
    tagline: "Clean, cinematic, broadcast-ready",
    defaultWordsPerPage: 7,
    defaultAccent: "#FFFFFF",
    previewBackground:
      "linear-gradient(135deg,#0c0c10 0%,#1c1c24 100%)",
  },
  {
    id: "neon",
    name: "Neon",
    tagline: "Glowing cyberpunk",
    defaultWordsPerPage: 3,
    defaultAccent: "#00FFD1",
    previewBackground:
      "linear-gradient(135deg,#0a0014 0%,#2b004d 60%,#5c0094 100%)",
  },
  {
    id: "glitch",
    name: "Glitch",
    tagline: "RGB split, scanlines",
    defaultWordsPerPage: 3,
    defaultAccent: "#00FFD1",
    previewBackground:
      "linear-gradient(135deg,#0a0010 0%,#1a0824 60%,#270f38 100%)",
  },
  {
    id: "typewriter",
    name: "Typewriter",
    tagline: "Character-by-character reveal",
    defaultWordsPerPage: 6,
    defaultAccent: "#E5E5E5",
    previewBackground:
      "linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%)",
  },
  {
    id: "broadcast",
    name: "Broadcast",
    tagline: "News-style lower third",
    defaultWordsPerPage: 8,
    defaultAccent: "#FF4D6D",
    previewBackground:
      "linear-gradient(135deg,#0a0a12 0%,#1a1a2f 100%)",
  },
];

export type StudioJob = {
  id: string;
  fileName: string;
  videoSrc: string;
  videoDurationSec: number;
  videoDimensions: { width: number; height: number };
  captions: Caption[];
  sourceMode: "transcript" | "script";
  scriptUsed: string | null;
};

export type CaptionedVideoProps = {
  videoSrc: string;
} & CaptionOverlayProps;

// --- Aspect ratio presets ---------------------------------------------------
// Social canvases. Dimensions match the output resolution used when rendering.
// `safeTop` / `safeBottom` are normalized fractions of the canvas height that
// platform UI (TikTok caption, share rail, IG sticker row, etc.) typically
// covers. The caption position overlay uses them to draw guides and to
// auto-nudge captions into a safe spot when the canvas changes.

export type AspectPresetId = "source" | "9x16" | "1x1" | "16x9";

export type AspectPreset = {
  id: AspectPresetId;
  label: string;
  /** Short text for segmented control tick. */
  tick: string;
  /** Short descriptor shown under the picker. */
  blurb: string;
  /** Output dimensions. `null` for "source" (use the input video's size). */
  dimensions: { width: number; height: number } | null;
  /** Top-safe fraction (platform UI covers from top). */
  safeTop: number;
  /** Bottom-safe fraction (platform UI covers from bottom). */
  safeBottom: number;
};

export const ASPECT_PRESETS: AspectPreset[] = [
  {
    id: "source",
    label: "Source",
    tick: "Source",
    blurb: "Match the input video",
    dimensions: null,
    safeTop: 0.04,
    safeBottom: 0.04,
  },
  {
    id: "9x16",
    label: "Vertical",
    tick: "9:16",
    blurb: "TikTok, Reels, Shorts",
    dimensions: { width: 1080, height: 1920 },
    safeTop: 0.1,
    safeBottom: 0.18,
  },
  {
    id: "1x1",
    label: "Square",
    tick: "1:1",
    blurb: "Feed posts",
    dimensions: { width: 1080, height: 1080 },
    safeTop: 0.06,
    safeBottom: 0.06,
  },
  {
    id: "16x9",
    label: "Wide",
    tick: "16:9",
    blurb: "YouTube, landing hero",
    dimensions: { width: 1920, height: 1080 },
    safeTop: 0.08,
    safeBottom: 0.08,
  },
];

export function getAspectPreset(id: AspectPresetId): AspectPreset {
  return ASPECT_PRESETS.find((p) => p.id === id) ?? ASPECT_PRESETS[0];
}

// --- Brand kits -------------------------------------------------------------
// Persisted locally (localStorage). A kit bundles the full look: style, words-
// per-page, position, accent, shadow, font scale, and aspect. Applying a kit
// leaves captions and the source video alone.

export type BrandKit = {
  id: string;
  name: string;
  createdAt: number;
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  aspectId: AspectPresetId;
};
