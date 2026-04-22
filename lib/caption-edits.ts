import type { Caption } from "@remotion/captions";

export const MIN_WORD_MS = 40;

const clampTime = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function updateText(
  captions: Caption[],
  index: number,
  nextText: string,
): Caption[] {
  const trimmed = nextText.trim();
  if (!trimmed) return deleteWord(captions, index);
  const next = captions.slice();
  next[index] = { ...next[index], text: trimmed };
  return next;
}

export function retimeWord(
  captions: Caption[],
  index: number,
  patch: { startMs?: number; endMs?: number },
): Caption[] {
  const current = captions[index];
  if (!current) return captions;
  const prevEnd = captions[index - 1]?.endMs ?? 0;
  const nextStart = captions[index + 1]?.startMs ?? Number.POSITIVE_INFINITY;

  let startMs = patch.startMs ?? current.startMs;
  let endMs = patch.endMs ?? current.endMs;

  startMs = clampTime(startMs, prevEnd, nextStart - MIN_WORD_MS);
  endMs = clampTime(endMs, startMs + MIN_WORD_MS, nextStart);

  const copy = captions.slice();
  copy[index] = {
    ...current,
    startMs,
    endMs,
    timestampMs: current.timestampMs == null ? null : startMs,
  };
  return copy;
}

export function deleteWord(captions: Caption[], index: number): Caption[] {
  if (index < 0 || index >= captions.length) return captions;
  const copy = captions.slice();
  copy.splice(index, 1);
  return copy;
}

export function mergeWithNext(captions: Caption[], index: number): Caption[] {
  const a = captions[index];
  const b = captions[index + 1];
  if (!a || !b) return captions;
  const merged: Caption = {
    text: `${a.text}${a.text.endsWith(" ") || b.text.startsWith(" ") ? "" : " "}${b.text}`.trim(),
    startMs: a.startMs,
    endMs: b.endMs,
    timestampMs: a.timestampMs == null ? null : a.startMs,
    confidence:
      a.confidence == null || b.confidence == null
        ? null
        : Math.min(a.confidence, b.confidence),
  };
  const copy = captions.slice();
  copy.splice(index, 2, merged);
  return copy;
}

export function splitWord(
  captions: Caption[],
  index: number,
  firstText: string,
  secondText: string,
): Caption[] {
  const original = captions[index];
  if (!original) return captions;
  const first = firstText.trim();
  const second = secondText.trim();
  if (!first || !second) return captions;

  const total = Math.max(original.endMs - original.startMs, MIN_WORD_MS * 2);
  const ratio = first.length / (first.length + second.length);
  const midMs = original.startMs + Math.round(total * ratio);

  const a: Caption = {
    ...original,
    text: first,
    endMs: Math.max(original.startMs + MIN_WORD_MS, midMs),
    timestampMs: original.timestampMs == null ? null : original.startMs,
  };
  const b: Caption = {
    ...original,
    text: second,
    startMs: a.endMs,
    endMs: Math.max(a.endMs + MIN_WORD_MS, original.endMs),
    timestampMs: original.timestampMs == null ? null : a.endMs,
  };
  const copy = captions.slice();
  copy.splice(index, 1, a, b);
  return copy;
}

/** Find the word index whose time range contains ms, or the closest upcoming. */
export function findActiveWordIndex(
  captions: Caption[],
  ms: number,
): number {
  if (captions.length === 0) return -1;
  for (let i = 0; i < captions.length; i++) {
    const c = captions[i];
    if (ms < c.startMs) return i === 0 ? 0 : i - 1;
    if (ms >= c.startMs && ms < c.endMs) return i;
  }
  return captions.length - 1;
}

/** Format milliseconds as M:SS.hh (editorial timestamp). */
export function formatTimestamp(ms: number): string {
  const totalSec = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  const hundredths = Math.floor((totalSec % 1) * 100);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${hundredths
    .toString()
    .padStart(2, "0")}`;
}
