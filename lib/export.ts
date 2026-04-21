import { createTikTokStyleCaptions, serializeSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

export function downloadSrt(
  captions: Caption[],
  baseName: string,
  wordsPerLine = 7,
) {
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: Math.max(800, wordsPerLine * 380),
  });

  const lines: Caption[][] = pages.map((page) => [
    {
      text: page.text.trim(),
      startMs: page.startMs,
      endMs: page.startMs + page.durationMs,
      timestampMs: page.startMs + Math.round(page.durationMs / 2),
      confidence: null,
    },
  ]);

  const srt = serializeSrt({ lines });
  const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${baseName}.srt`);
}

export function downloadJson(captions: Caption[], baseName: string) {
  const blob = new Blob([JSON.stringify(captions, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, `${baseName}.captions.json`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
