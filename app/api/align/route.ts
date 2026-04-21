import { NextRequest, NextResponse } from "next/server";
import { transcribeBufferToWords } from "@/lib/deepgram";
import { alignScriptToWords } from "@/lib/alignment";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const script = formData.get("script");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' in form data." },
        { status: 400 },
      );
    }
    if (typeof script !== "string" || script.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'script'." },
        { status: 400 },
      );
    }

    const apiKey = req.headers.get("x-deepgram-key");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const mime = file.type || "audio/wav";

    const words = await transcribeBufferToWords(buffer, mime, apiKey);
    const captions = alignScriptToWords(script, words);

    return NextResponse.json({ captions, wordCount: captions.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Alignment failed.";
    console.error("/api/align failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
