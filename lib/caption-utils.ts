import type { Caption } from "@remotion/captions";

/**
 * Estimate caption duration in ms. Used to set the Remotion composition length
 * to at least cover every caption, plus a small tail.
 */
export function captionsDurationMs(captions: Caption[]): number {
  if (captions.length === 0) return 1000;
  const lastEnd = captions[captions.length - 1].endMs;
  return Math.max(lastEnd + 1000, 2000);
}

export function secondsToFrames(sec: number, fps: number): number {
  return Math.round(sec * fps);
}

export function msToFrames(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}
