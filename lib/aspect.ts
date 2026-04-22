import {
  ASPECT_PRESETS,
  getAspectPreset,
  type AspectPreset,
  type AspectPresetId,
  type CaptionPosition,
} from "./types";

export type Dimensions = { width: number; height: number };

/**
 * Resolve the canvas the preview + exporter should render into given the
 * chosen preset and the source video's native size. "Source" falls through to
 * the input dimensions; every other preset uses its own fixed resolution.
 */
export function resolveCanvas(
  preset: AspectPresetId,
  source: Dimensions,
): Dimensions {
  const p = getAspectPreset(preset);
  return p.dimensions ?? source;
}

/**
 * The source video is letterboxed with `object-fit: contain` inside the
 * canvas. This returns the rectangle the video actually occupies, normalized
 * to 0-1 within the canvas (xStart, xEnd, yStart, yEnd).
 */
export function getVideoBox(
  source: Dimensions,
  canvas: Dimensions,
): { xStart: number; xEnd: number; yStart: number; yEnd: number } {
  const sourceAr = source.width / source.height;
  const canvasAr = canvas.width / canvas.height;
  if (Math.abs(sourceAr - canvasAr) < 0.001) {
    return { xStart: 0, xEnd: 1, yStart: 0, yEnd: 1 };
  }
  if (sourceAr > canvasAr) {
    // Video is wider than canvas → letterbox top + bottom.
    const videoHeight = canvas.width / sourceAr;
    const inset = (canvas.height - videoHeight) / 2 / canvas.height;
    return { xStart: 0, xEnd: 1, yStart: inset, yEnd: 1 - inset };
  }
  // Video is taller than canvas → pillarbox left + right.
  const videoWidth = canvas.height * sourceAr;
  const inset = (canvas.width - videoWidth) / 2 / canvas.width;
  return { xStart: inset, xEnd: 1 - inset, yStart: 0, yEnd: 1 };
}

/**
 * When the canvas changes, nudge the caption position so it stays inside the
 * letterboxed video AND respects platform-UI safe zones (TikTok bottom rail,
 * Shorts button stack, etc.). Keeps the intent — if the user was pinned to
 * the bottom, we keep them near the bottom of the safe area, not on a black
 * bar.
 */
export function reflowPosition(
  position: CaptionPosition,
  source: Dimensions,
  preset: AspectPreset,
): CaptionPosition {
  const canvas = preset.dimensions ?? source;
  const box = getVideoBox(source, canvas);
  const minX = Math.max(0.15, box.xStart + 0.05);
  const maxX = Math.min(0.85, box.xEnd - 0.05);
  const minY = Math.max(preset.safeTop, box.yStart + 0.04);
  const maxY = Math.min(1 - preset.safeBottom, box.yEnd - 0.04);

  const x = clamp(position.x, minX, maxX);
  let y = position.y;
  // If the user was anchored top/bottom, keep that anchor inside the new safe
  // zone instead of letterbox.
  if (position.y >= 0.75) {
    y = maxY;
  } else if (position.y <= 0.25) {
    y = minY;
  } else {
    y = clamp(position.y, minY, maxY);
  }
  return { x, y };
}

function clamp(v: number, min: number, max: number) {
  if (max < min) return (min + max) / 2;
  return Math.max(min, Math.min(max, v));
}

export { ASPECT_PRESETS, getAspectPreset };
export type { AspectPreset, AspectPresetId };
