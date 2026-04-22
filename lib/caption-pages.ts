import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";

export type CaptionPage = {
  text: string;
  startMs: number;
  endMs: number;
  startIndex: number;
  endIndex: number;
};

/**
 * Build pages from explicit post-word break indices. A break at index `k`
 * means: end a page after caption[k]. The final page runs to the last caption.
 * Returns empty when no captions are provided; falls back to a single page
 * when no breaks are given.
 */
export function buildPagesFromBreaks(
  captions: Caption[],
  breakIndices: number[],
): CaptionPage[] {
  if (captions.length === 0) return [];
  const boundaries = Array.from(
    new Set(breakIndices.filter((i) => i >= 0 && i < captions.length - 1)),
  ).sort((a, b) => a - b);
  const pages: CaptionPage[] = [];
  let start = 0;
  const tailMs = (captions[captions.length - 1]?.endMs ?? 0) + 500;
  for (let b = 0; b <= boundaries.length; b++) {
    const end = b < boundaries.length ? boundaries[b] : captions.length - 1;
    const slice = captions.slice(start, end + 1);
    if (slice.length === 0) {
      start = end + 1;
      continue;
    }
    const startMs = slice[0].startMs;
    const pageEndMs = slice[slice.length - 1].endMs;
    const nextStart = end + 1 < captions.length ? captions[end + 1].startMs : tailMs;
    pages.push({
      text: slice.map((c) => c.text).join(" "),
      startMs,
      endMs: Math.min(nextStart, pageEndMs + 300),
      startIndex: start,
      endIndex: end,
    });
    start = end + 1;
  }
  return pages;
}

/**
 * Group word-level captions into on-screen pages using the same combine
 * heuristic as the Remotion renderer. Each page's `endMs` matches the
 * visible window — `min(nextPage.startMs, startMs + max(durationMs, combineMs))`.
 */
export function buildPages(
  captions: Caption[],
  wordsPerPage: number,
): CaptionPage[] {
  if (captions.length === 0) return [];
  const combineMs = Math.max(400, Math.round(wordsPerPage * 380));
  const { pages: rawPages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: combineMs,
  });
  const lastEnd = captions[captions.length - 1]?.endMs ?? 0;
  const tailMs = lastEnd + 1000;
  const result: CaptionPage[] = [];
  let cursor = 0;
  for (let i = 0; i < rawPages.length; i++) {
    const page = rawPages[i];
    const nextPage = rawPages[i + 1];
    const startIndex = cursor;
    const endIndex = cursor + page.tokens.length - 1;
    const slice = captions.slice(startIndex, endIndex + 1);
    const nextStartMs = nextPage ? nextPage.startMs : tailMs;
    const visibleEndMs = Math.min(
      nextStartMs,
      page.startMs + Math.max(page.durationMs, combineMs),
    );
    result.push({
      text: slice.map((c) => c.text).join(" "),
      startMs: page.startMs,
      endMs: visibleEndMs,
      startIndex,
      endIndex,
    });
    cursor += page.tokens.length;
  }
  return result;
}

/**
 * Replace a page's text with `cleaned`:
 * - Same word count → preserve every word's original timing.
 * - Different count → redistribute timings proportionally over the page's window.
 * - Empty → delete the page's captions.
 */
export function redistributePage(
  captions: Caption[],
  page: CaptionPage,
  cleaned: string,
): Caption[] {
  const newWords = cleaned.trim().split(/\s+/).filter(Boolean);
  const count = page.endIndex - page.startIndex + 1;

  if (newWords.length === 0) {
    return [
      ...captions.slice(0, page.startIndex),
      ...captions.slice(page.endIndex + 1),
    ];
  }

  // Match the producer convention (lib/deepgram.ts wordsToCaptions): every
  // word except the very first of the stream carries a leading space.
  // createTikTokStyleCaptions uses that leading space to detect page
  // boundaries — without it, the renderer collapses everything into a single
  // mega-page and all translated words show simultaneously.
  function wordText(globalIndex: number, word: string) {
    return globalIndex === 0 ? word : ` ${word}`;
  }

  if (newWords.length === count) {
    const next = captions.slice();
    for (let i = 0; i < newWords.length; i++) {
      const idx = page.startIndex + i;
      next[idx] = { ...next[idx], text: wordText(idx, newWords[i]) };
    }
    return next;
  }

  const spanMs = Math.max(1, page.endMs - page.startMs);
  const sliceMs = spanMs / newWords.length;
  const replaced: Caption[] = newWords.map((text, i) => {
    const startMs = Math.round(page.startMs + i * sliceMs);
    const endMs = Math.round(page.startMs + (i + 1) * sliceMs);
    return {
      text: wordText(page.startIndex + i, text),
      startMs,
      endMs,
      timestampMs: startMs,
      confidence: null,
    };
  });
  return [
    ...captions.slice(0, page.startIndex),
    ...replaced,
    ...captions.slice(page.endIndex + 1),
  ];
}
