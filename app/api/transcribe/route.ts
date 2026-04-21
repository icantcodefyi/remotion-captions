import { NextRequest, NextResponse } from "next/server";
import {
  transcribeBufferToWords,
  wordsToCaptions,
} from "@/lib/deepgram";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' in form data." },
        { status: 400 },
      );
    }

    const apiKey = req.headers.get("x-deepgram-key");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const mime = file.type || "audio/wav";

    const words = await transcribeBufferToWords(buffer, mime, apiKey);
    const captions = wordsToCaptions(words);

    return NextResponse.json({ captions, wordCount: words.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Transcription failed.";
    console.error("/api/transcribe failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
