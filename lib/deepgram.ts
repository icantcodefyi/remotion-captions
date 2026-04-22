import "server-only";
import { DeepgramClient } from "@deepgram/sdk";
import type { Caption } from "@remotion/captions";

export type DeepgramWord = {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
};

export function getDeepgramClient(apiKey?: string | null) {
  const key = apiKey ?? process.env.DEEPGRAM_API_KEY;
  if (!key) {
    throw new Error(
      "No Deepgram API key. Add one in the app (Settings → API Key) — get a free key at https://console.deepgram.com",
    );
  }
  return new DeepgramClient({ apiKey: key });
}

export async function transcribeBufferToWords(
  buffer: Uint8Array,
  mimeType: string,
  apiKey?: string | null,
) {
  const client = getDeepgramClient(apiKey);

  // Cast to Blob-compatible uploadable; Deepgram SDK accepts a Blob/File/Buffer.
  const blob = new Blob([buffer as unknown as BlobPart], { type: mimeType });

  const response = await client.listen.v1.media.transcribeFile(blob, {
    model: "nova-3",
    smart_format: true,
    punctuate: true,
    utterances: false,
    diarize: false,
    detect_language: true,
  });

  if (!("results" in response) || !response.results) {
    throw new Error(
      "Deepgram returned an async/accepted response unexpectedly. Make sure no callback URL is set.",
    );
  }

  const alternatives =
    response.results.channels?.[0]?.alternatives?.[0] ?? null;

  const words = (alternatives?.words ?? []) as DeepgramWord[];

  if (words.length === 0) {
    throw new Error(
      "Deepgram returned no words. The audio may be silent or in an unsupported format.",
    );
  }

  return words;
}

export function wordsToCaptions(words: DeepgramWord[]) {
  return words.map((w, index) => {
    const text = (w.punctuated_word ?? w.word) ?? "";
    // First word in a caption stream doesn't get a leading space so caption
    // pages look clean when joined; all subsequent words do.
    const prefix = index === 0 ? "" : " ";
    return {
      text: prefix + text,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      timestampMs: Math.round(((w.start + w.end) / 2) * 1000),
      confidence: w.confidence ?? null,
    } satisfies Caption;
  });
}
