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

  if (newWords.length === count) {
    const next = captions.slice();
    for (let i = 0; i < newWords.length; i++) {
      const idx = page.startIndex + i;
      next[idx] = { ...next[idx], text: newWords[i] };
    }
    return next;
  }

  const spanMs = Math.max(1, page.endMs - page.startMs);
  const sliceMs = spanMs / newWords.length;
  const replaced: Caption[] = newWords.map((text, i) => {
    const startMs = Math.round(page.startMs + i * sliceMs);
    const endMs = Math.round(page.startMs + (i + 1) * sliceMs);
    return {
      text,
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
