import type { DeepgramWord } from "./deepgram";

function tokenizeScript(script: string) {
  // Split on whitespace preserving punctuation attached to words; also split
  // isolated punctuation as its own token (we'll merge later).
  const raw = script
    .replace(/\s+/g, " ")
    .trim()
    .split(/(\s+)/)
    .filter((s) => s.trim().length > 0);

  return raw.map((token) => {
    const normalized = token
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}']/gu, "");
    return {
      original: token,
      normalized,
      isPunct: normalized.length === 0,
    };
  });
}

function normalizeTranscriptWord(w: DeepgramWord) {
  return (w.word ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}']/gu, "");
}

/**
 * Align a user-provided script to Deepgram word timestamps using a
 * Needleman-Wunsch style global alignment. For any script word that did
 * not map to a transcript word (filler, rewrite, mistake, etc.) we
 * interpolate its time from neighbouring anchors.
 */
export function alignScriptToWords(
  script: string,
  transcriptWords: DeepgramWord[],
) {
  const scriptTokens = tokenizeScript(script).filter((t) => !t.isPunct);
  const transcriptTokens = transcriptWords.map((w) => ({
    word: w,
    normalized: normalizeTranscriptWord(w),
  }));

  if (scriptTokens.length === 0) return [];
  if (transcriptTokens.length === 0) {
    // No audio words - distribute script evenly across a 5s window as a fallback.
    const perWordMs = 500;
    return scriptTokens.map((tok, i) => ({
      text: (i === 0 ? "" : " ") + tok.original,
      startMs: i * perWordMs,
      endMs: (i + 1) * perWordMs,
      timestampMs: i * perWordMs + perWordMs / 2,
      confidence: null,
    }));
  }

  const n = scriptTokens.length;
  const m = transcriptTokens.length;

  // Scoring: match +2, mismatch -1, indel -1
  const MATCH = 2;
  const MISMATCH = -1;
  const GAP = -1;

  // dp matrix (n+1) x (m+1)
  const dp: Int32Array[] = Array.from(
    { length: n + 1 },
    () => new Int32Array(m + 1),
  );
  const trace: Uint8Array[] = Array.from(
    { length: n + 1 },
    () => new Uint8Array(m + 1),
  );
  // 0 = stop, 1 = diag, 2 = up (skip script), 3 = left (skip transcript)

  for (let i = 1; i <= n; i++) {
    dp[i][0] = i * GAP;
    trace[i][0] = 2;
  }
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j * GAP;
    trace[0][j] = 3;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const match = scriptTokens[i - 1].normalized === transcriptTokens[j - 1].normalized;
      const diag = dp[i - 1][j - 1] + (match ? MATCH : MISMATCH);
      const up = dp[i - 1][j] + GAP;
      const left = dp[i][j - 1] + GAP;
      let best = diag;
      let dir: number = 1;
      if (up > best) {
        best = up;
        dir = 2;
      }
      if (left > best) {
        best = left;
        dir = 3;
      }
      dp[i][j] = best;
      trace[i][j] = dir;
    }
  }

  // Walk the traceback. Record per-script anchor: (scriptIndex -> transcriptWord)
  const anchors = new Array<DeepgramWord | null>(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const dir = trace[i][j];
    if (dir === 1) {
      const sIdx = i - 1;
      const match = scriptTokens[sIdx].normalized === transcriptTokens[j - 1].normalized;
      if (match) {
        anchors[sIdx] = transcriptTokens[j - 1].word;
      }
      i--;
      j--;
    } else if (dir === 2) {
      // script token had no match
      i--;
    } else if (dir === 3) {
      j--;
    } else {
      break;
    }
  }

  // Interpolate start/end for non-anchored script tokens.
  // Strategy: between two anchors A (at scriptIdx a) and B (at scriptIdx b), distribute
  // the (b - a) intermediate tokens linearly across (A.end -> B.start).
  const firstAnchorIdx = anchors.findIndex((a) => a !== null);
  const lastAnchorIdx = (function findLastAnchorIdx() {
    for (let k = anchors.length - 1; k >= 0; k--) if (anchors[k]) return k;
    return -1;
  })();

  if (firstAnchorIdx === -1) {
    // Nothing anchored - fall back to even distribution across the transcript span.
    const totalStart = transcriptWords[0].start;
    const totalEnd = transcriptWords[transcriptWords.length - 1].end;
    const per = (totalEnd - totalStart) / Math.max(1, scriptTokens.length);
    return scriptTokens.map((tok, idx) => {
      const s = totalStart + idx * per;
      const e = totalStart + (idx + 1) * per;
      return {
        text: (idx === 0 ? "" : " ") + tok.original,
        startMs: Math.round(s * 1000),
        endMs: Math.round(e * 1000),
        timestampMs: Math.round(((s + e) / 2) * 1000),
        confidence: null,
      };
    });
  }

  const times = new Array<{ start: number; end: number } | null>(n).fill(null);
  for (let k = 0; k < n; k++) {
    const a = anchors[k];
    if (a) times[k] = { start: a.start, end: a.end };
  }

  // Handle leading unmatched (before first anchor): stretch from transcript start.
  if (firstAnchorIdx > 0) {
    const firstAnchor = anchors[firstAnchorIdx]!;
    const span = Math.max(0.05, firstAnchor.start - transcriptWords[0].start);
    const per = span / firstAnchorIdx;
    for (let k = 0; k < firstAnchorIdx; k++) {
      const start = transcriptWords[0].start + per * k;
      const end = transcriptWords[0].start + per * (k + 1);
      times[k] = { start, end };
    }
  }

  // Middle gaps
  let prevAnchor = firstAnchorIdx;
  for (let k = firstAnchorIdx + 1; k <= lastAnchorIdx; k++) {
    if (anchors[k]) {
      const gap = k - prevAnchor - 1;
      if (gap > 0) {
        const a = anchors[prevAnchor]!;
        const b = anchors[k]!;
        const spanStart = a.end;
        const spanEnd = b.start;
        const dur = Math.max(0.05, spanEnd - spanStart);
        const per = dur / gap;
        for (let g = 0; g < gap; g++) {
          const start = spanStart + per * g;
          const end = spanStart + per * (g + 1);
          times[prevAnchor + 1 + g] = { start, end };
        }
      }
      prevAnchor = k;
    }
  }

  // Trailing unmatched (after last anchor): stretch to transcript end.
  if (lastAnchorIdx < n - 1) {
    const lastAnchor = anchors[lastAnchorIdx]!;
    const transcriptEnd = transcriptWords[transcriptWords.length - 1].end;
    const tail = n - 1 - lastAnchorIdx;
    const span = Math.max(0.05, transcriptEnd - lastAnchor.end);
    const per = span / tail;
    for (let g = 0; g < tail; g++) {
      const start = lastAnchor.end + per * g;
      const end = lastAnchor.end + per * (g + 1);
      times[lastAnchorIdx + 1 + g] = { start, end };
    }
  }

  return scriptTokens.map((tok, idx) => {
    const t = times[idx];
    const startSec = t?.start ?? 0;
    const endSec = t?.end ?? startSec + 0.25;
    const startMs = Math.round(startSec * 1000);
    const endMs = Math.round(Math.max(startSec + 0.05, endSec) * 1000);
    return {
      text: (idx === 0 ? "" : " ") + tok.original,
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      confidence: null,
    };
  });
}
