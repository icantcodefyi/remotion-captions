/** Normalised peak amplitude buckets (0–1) from an audio/video file's audio track. */
export type WaveformPeaks = {
  peaks: Float32Array;
  durationMs: number;
};

function abortError() {
  return new DOMException("Aborted", "AbortError");
}

/**
 * Decode an audio or video file into a `targetBuckets`-length Float32Array of
 * normalised peak amplitudes. The underlying AudioContext is closed before
 * resolution, so this is safe to call repeatedly.
 */
export async function extractPeaks(
  file: File,
  targetBuckets: number,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw abortError();
  const arrayBuffer = await file.arrayBuffer();
  if (signal?.aborted) throw abortError();

  const Ctor: typeof AudioContext | undefined =
    typeof window === "undefined"
      ? undefined
      : window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

  if (!Ctor) throw new Error("Web Audio API unavailable in this browser.");

  const ctx = new Ctor();
  try {
    const audio = await ctx.decodeAudioData(arrayBuffer.slice(0));
    if (signal?.aborted) throw abortError();

    const length = audio.length;
    const channels = Math.min(audio.numberOfChannels, 2);
    const ch0 = audio.getChannelData(0);
    const ch1 = channels > 1 ? audio.getChannelData(1) : null;
    const buckets = Math.max(1, Math.min(targetBuckets, length));
    const samplesPerBucket = length / buckets;
    const peaks = new Float32Array(buckets);

    for (let b = 0; b < buckets; b++) {
      const start = Math.floor(b * samplesPerBucket);
      const end = Math.min(length, Math.floor((b + 1) * samplesPerBucket));
      let peak = 0;
      for (let i = start; i < end; i++) {
        const v = ch1
          ? (Math.abs(ch0[i]) + Math.abs(ch1[i])) * 0.5
          : Math.abs(ch0[i]);
        if (v > peak) peak = v;
      }
      peaks[b] = peak;
    }

    let globalMax = 0;
    for (let i = 0; i < peaks.length; i++) {
      if (peaks[i] > globalMax) globalMax = peaks[i];
    }
    if (globalMax > 0) {
      for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i] / globalMax;
    }

    return { peaks, durationMs: audio.duration * 1000 };
  } finally {
    void ctx.close().catch(() => {});
  }
}
