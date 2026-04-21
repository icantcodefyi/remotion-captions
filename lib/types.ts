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
  | "broadcast";

export type CaptionPosition = "top" | "center" | "bottom";

export type StyleOptions = {
  position: CaptionPosition;
  fontScale: number;
  wordsPerPage: number;
  accentColor: string;
  shadow: boolean;
};

export const DEFAULT_STYLE_OPTIONS: StyleOptions = {
  position: "bottom",
  fontScale: 1,
  wordsPerPage: 3,
  accentColor: "#C4FF3D",
  shadow: true,
};

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
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
};
