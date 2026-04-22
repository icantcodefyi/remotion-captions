"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Caption } from "@remotion/captions";

export type DelimiterId = "comma" | "period" | "pipe" | "newline";

export type Delimiter = {
  id: DelimiterId;
  label: string;
  glyph: string;
  joiner: string;
  splitRegex: RegExp;
  hardBreak: boolean;
};

export const DELIMITERS: Record<DelimiterId, Delimiter> = {
  comma: {
    id: "comma",
    label: "Comma",
    glyph: ",",
    joiner: ", ",
    splitRegex: /,\s*/g,
    hardBreak: false,
  },
  period: {
    id: "period",
    label: "Period",
    glyph: ".",
    joiner: ". ",
    splitRegex: /\.\s*/g,
    hardBreak: false,
  },
  pipe: {
    id: "pipe",
    label: "Pipe",
    glyph: "|",
    joiner: " | ",
    splitRegex: /\s*\|\s*/g,
    hardBreak: true,
  },
  newline: {
    id: "newline",
    label: "Line",
    glyph: "↵",
    joiner: "\n",
    splitRegex: /\n+/g,
    hardBreak: true,
  },
};

export const DELIMITER_LIST: Delimiter[] = [
  DELIMITERS.comma,
  DELIMITERS.period,
  DELIMITERS.pipe,
  DELIMITERS.newline,
];

/**
 * Join captions into an editable paragraph.
 *
 * - Soft delimiters (comma, period) are inserted between every word, because
 *   real prose is made of those characters — they read naturally.
 * - Hard delimiters (pipe, newline) are inserted ONLY at the supplied break
 *   positions; everywhere else words are separated by a single space. This
 *   preserves the user's chosen page boundaries on re-align and avoids
 *   turning every word into its own page.
 */
export function joinCaptions(
  captions: Caption[],
  delimiter: Delimiter,
  breaks: number[] = [],
): string {
  if (!delimiter.hardBreak) {
    return captions.map((c) => c.text).join(delimiter.joiner);
  }
  const breakSet = new Set(breaks);
  let out = "";
  for (let i = 0; i < captions.length; i++) {
    out += captions[i].text;
    if (i === captions.length - 1) break;
    out += breakSet.has(i) ? delimiter.joiner : " ";
  }
  return out;
}

/**
 * For hard-break delimiters, walk the script and compute post-word break indices.
 * Example: delimiter="|", script="a b | c d e | f" → segments=[2,3,1] → breaks=[1, 4].
 *
 * A "break index" means: after the caption at this index, force a new on-screen page.
 * Returns [] for soft delimiters or empty/single-segment scripts.
 */
export function deriveBreaks(script: string, delimiter: Delimiter) {
  if (!delimiter.hardBreak) return [];
  const segments = script
    .split(delimiter.splitRegex)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length <= 1) return [];
  const breaks: number[] = [];
  let cursor = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    const words = segments[i].split(/\s+/).filter(Boolean);
    cursor += words.length;
    if (words.length > 0) breaks.push(cursor - 1);
  }
  return breaks;
}

/** Strip hard-break markers before sending the script to the alignment endpoint. */
export function stripForAlignment(script: string, delimiter: Delimiter) {
  if (!delimiter.hardBreak) return script;
  return script.replace(delimiter.splitRegex, " ").replace(/\s+/g, " ").trim();
}

const STORAGE_KEY = "caption-studio.delimiter";
const EVENT = "caption-studio:delimiter-change";

function isDelimiterId(v: unknown): v is DelimiterId {
  return v === "comma" || v === "period" || v === "pipe" || v === "newline";
}

export function getDelimiterId() {
  if (typeof window === "undefined") return "comma";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isDelimiterId(v) ? v : "comma";
  } catch {
    return "comma";
  }
}

export function setDelimiterId(id: DelimiterId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useDelimiter() {
  const id = useSyncExternalStore(
    subscribe,
    getDelimiterId,
    () => "comma" as DelimiterId,
  );
  const set = useCallback((next: DelimiterId) => setDelimiterId(next), []);
  return [DELIMITERS[id], set] as const;
}
