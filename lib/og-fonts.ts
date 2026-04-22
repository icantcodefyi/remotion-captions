import { readFile } from "node:fs/promises";
import path from "node:path";

const FONT_DIR = path.join(process.cwd(), "lib", "og-fonts-data");

let cached: Promise<OgFont[]> | null = null;

export type OgFont = {
  name: "Display" | "Body" | "Italic";
  data: ArrayBuffer;
  weight: 500 | 700;
  style: "normal" | "italic";
};

async function readFont(file: string) {
  const buf = await readFile(path.join(FONT_DIR, file));
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}

export function getOgFonts() {
  if (cached) return cached;
  cached = (async () => {
    const [display, body, italic] = await Promise.all([
      readFont("bricolage-grotesque-700.ttf"),
      readFont("host-grotesk-500.ttf"),
      readFont("spectral-500-italic.ttf"),
    ]);
    return [
      { name: "Display", data: display, weight: 700, style: "normal" },
      { name: "Body", data: body, weight: 500, style: "normal" },
      { name: "Italic", data: italic, weight: 500, style: "italic" },
    ];
  })();
  return cached;
}

export const OG_PALETTE = {
  paper: "#f4efdf",
  paperDeep: "#ebe4c9",
  ink: "#181812",
  inkSoft: "#4d4b3e",
  inkMuted: "#8a8574",
  rule: "rgba(24,24,18,0.12)",
  ruleSoft: "rgba(24,24,18,0.07)",
  lime: "#caf23d",
  limeDeep: "#344606",
  limeGlow: "rgba(196,245,61,0.32)",
  paperSurface: "rgba(255,255,255,0.55)",
} as const;
