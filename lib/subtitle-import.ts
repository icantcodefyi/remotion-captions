import { parseSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

type SubtitleCue = {
  text: string;
  startMs: number;
  endMs: number;
};

export type ImportedSubtitleTrack = {
  captions: Caption[];
  breaks: number[];
  format: "srt" | "vtt" | "json";
  cueCount: number;
};

export function importSubtitleTrack(
  input: string,
  fileName: string,
): ImportedSubtitleTrack {
  const normalizedInput = input.replace(/^\uFEFF/, "");
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "srt") {
    const cues = parseSrt({ input: normalizedInput }).captions.map((cue) => ({
      text: cue.text,
      startMs: cue.startMs,
      endMs: cue.endMs,
    }));
    return {
      ...cuesToWordCaptions(cues),
      format: "srt",
      cueCount: cues.length,
    };
  }

  if (extension === "vtt") {
    const cues = parseVtt(normalizedInput);
    return {
      ...cuesToWordCaptions(cues),
      format: "vtt",
      cueCount: cues.length,
    };
  }

  if (extension === "json") {
    const captions = parseCaptionJson(normalizedInput);
    return {
      captions,
      breaks: [],
      format: "json",
      cueCount: captions.length,
    };
  }

  throw new Error("Unsupported file type. Import .srt, .vtt, or .json.");
}

function parseCaptionJson(input: string): Caption[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("That JSON file couldn't be parsed.");
  }

  const rawCaptions = Array.isArray(parsed)
    ? parsed
    : isObject(parsed) && Array.isArray(parsed.captions)
      ? parsed.captions
      : null;

  if (!rawCaptions) {
    throw new Error("Expected a caption array or an object with a captions array.");
  }

  const captions = rawCaptions.map((value, index) =>
    normalizeCaption(value, index),
  );

  captions.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  return captions.map((caption, index) => {
    const minStart = index === 0 ? 0 : captions[index - 1].endMs;
    const startMs = Math.max(minStart, Math.round(caption.startMs));
    const endMs = Math.max(startMs + 1, Math.round(caption.endMs));
    return {
      ...caption,
      startMs,
      endMs,
      timestampMs:
        caption.timestampMs == null
          ? Math.round((startMs + endMs) / 2)
          : Math.round(caption.timestampMs),
    };
  });
}

function normalizeCaption(value: unknown, index: number): Caption {
  if (!isObject(value)) {
    throw new Error(`Caption ${index + 1} is not an object.`);
  }

  const text = typeof value.text === "string" ? value.text : null;
  const startMs = typeof value.startMs === "number" ? value.startMs : null;
  const endMs = typeof value.endMs === "number" ? value.endMs : null;

  if (text == null || startMs == null || endMs == null) {
    throw new Error(
      `Caption ${index + 1} must include text, startMs, and endMs.`,
    );
  }

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new Error(`Caption ${index + 1} has invalid timing.`);
  }

  const timestampMs =
    value.timestampMs == null
      ? null
      : typeof value.timestampMs === "number" && Number.isFinite(value.timestampMs)
        ? value.timestampMs
        : null;
  const confidence =
    value.confidence == null
      ? null
      : typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? value.confidence
        : null;

  return {
    text,
    startMs,
    endMs,
    timestampMs,
    confidence,
  };
}

function parseVtt(input: string): SubtitleCue[] {
  const blocks = input.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean);

    if (lines.length === 0) continue;
    if (lines[0] === "WEBVTT") continue;
    if (lines[0].startsWith("NOTE")) continue;

    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) continue;

    const timingLine = lines[timingIndex];
    const [startRaw, endPart] = timingLine.split(/\s+-->\s+/);
    const endRaw = endPart?.trim().split(/\s+/)[0];

    if (!startRaw || !endRaw) {
      throw new Error(`Invalid VTT cue timing: "${timingLine}"`);
    }

    const text = lines.slice(timingIndex + 1).join("\n");
    const cleaned = cleanCueText(text);
    if (!cleaned) continue;

    const startMs = parseTimestamp(startRaw);
    const endMs = parseTimestamp(endRaw);

    cues.push({
      text: cleaned,
      startMs,
      endMs,
    });
  }

  if (cues.length === 0) {
    throw new Error("No subtitle cues were found in that VTT file.");
  }

  return cues;
}

function parseTimestamp(raw: string): number {
  const match = raw.trim().match(
    /^(?:(\d+):)?(\d{2}):(\d{2})([.,](\d{3}))?$/,
  );
  if (!match) {
    throw new Error(`Invalid subtitle timestamp: "${raw}"`);
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const millis = Number(match[5] ?? 0);

  return hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + millis;
}

function cuesToWordCaptions(cues: SubtitleCue[]): {
  captions: Caption[];
  breaks: number[];
} {
  const captions: Caption[] = [];
  const breaks: number[] = [];

  cues.forEach((cue, cueIndex) => {
    const words = tokenizeCue(cue.text);
    if (words.length === 0) return;

    const timings = distributeWordTimings(cue.startMs, cue.endMs, words);
    for (let index = 0; index < words.length; index++) {
      const timing = timings[index];
      captions.push({
        text: captions.length === 0 ? words[index] : ` ${words[index]}`,
        startMs: timing.startMs,
        endMs: timing.endMs,
        timestampMs: Math.round((timing.startMs + timing.endMs) / 2),
        confidence: null,
      });
    }

    if (cueIndex < cues.length - 1) {
      breaks.push(captions.length - 1);
    }
  });

  if (captions.length === 0) {
    throw new Error("No subtitle text was found in that file.");
  }

  return { captions, breaks };
}

function tokenizeCue(text: string): string[] {
  return cleanCueText(text).split(/\s+/).filter(Boolean);
}

function cleanCueText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distributeWordTimings(
  startMs: number,
  endMs: number,
  words: string[],
): { startMs: number; endMs: number }[] {
  const safeStartMs = Math.max(0, Math.round(startMs));
  const safeEndMs = Math.max(safeStartMs + words.length, Math.round(endMs));
  const totalWeight = words.reduce(
    (sum, word) => sum + Math.max(1, word.replace(/[^\p{L}\p{N}']/gu, "").length),
    0,
  );

  let consumedWeight = 0;
  return words.map((word, index) => {
    const nextWeight =
      consumedWeight + Math.max(1, word.replace(/[^\p{L}\p{N}']/gu, "").length);
    const wordStartMs =
      index === 0
        ? safeStartMs
        : Math.round(
            safeStartMs +
              ((safeEndMs - safeStartMs) * consumedWeight) / totalWeight,
          );
    const wordEndMs =
      index === words.length - 1
        ? safeEndMs
        : Math.round(
            safeStartMs +
              ((safeEndMs - safeStartMs) * nextWeight) / totalWeight,
          );

    consumedWeight = nextWeight;

    return {
      startMs: wordStartMs,
      endMs: Math.max(wordStartMs + 1, wordEndMs),
    };
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
