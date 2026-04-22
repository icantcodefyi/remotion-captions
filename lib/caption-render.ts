import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";

type CaptionPagesResult = {
  combineMs: number;
  pages: TikTokPage[];
};

export function getCaptionPages(
  captions: Caption[],
  wordsPerPage: number,
): CaptionPagesResult {
  const combineMs = Math.max(400, Math.round(wordsPerPage * 380));

  if (captions.length === 0) {
    return { combineMs, pages: [] };
  }

  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: combineMs,
  });

  return { combineMs, pages };
}
