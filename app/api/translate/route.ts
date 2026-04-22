import { NextRequest, NextResponse } from "next/server";
import type { Caption } from "@remotion/captions";
import { buildPages, redistributePage } from "@/lib/caption-pages";
import { getLanguage, type LanguageCode } from "@/lib/translate";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type Body = {
  captions: Caption[];
  targetLanguage: LanguageCode;
  wordsPerPage?: number;
};

export async function POST(req: NextRequest) {
  try {
    const apiKey =
      req.headers.get("x-openai-key") ?? process.env.OPENAI_API_KEY ?? null;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No OpenAI API key. Add one in the app, or set OPENAI_API_KEY on the server.",
        },
        { status: 401 },
      );
    }

    const body = (await req.json()) as Body;
    const { captions, targetLanguage } = body;
    const wordsPerPage = Math.max(1, Math.min(12, body.wordsPerPage ?? 7));
    const language = getLanguage(targetLanguage);

    if (!captions || captions.length === 0) {
      return NextResponse.json(
        { error: "No captions to translate." },
        { status: 400 },
      );
    }

    // Page the captions into sentence-sized groups so the LLM gets enough
    // context to translate idiomatically. Each group is translated as a unit,
    // and the translated text is redistributed back across that group's
    // timings — preserving overall rhythm even though word counts differ
    // between languages.
    const translationPageSize = Math.max(wordsPerPage * 2, 10);
    const pages = buildPages(captions, translationPageSize);
    const originals = pages.map((p) => p.text);

    const translated = await translateStrings({
      strings: originals,
      targetLanguage: language.name,
      apiKey,
    });

    if (translated.length !== pages.length) {
      return NextResponse.json(
        {
          error: `Translator returned ${translated.length} segments, expected ${pages.length}.`,
        },
        { status: 502 },
      );
    }

    // Apply translations page-by-page, walking from the end so earlier page
    // indices remain valid after each redistribute (redistributePage can
    // change the total caption count when the word count differs).
    let working = captions;
    for (let i = pages.length - 1; i >= 0; i--) {
      const page = pages[i];
      const cleaned = translated[i].trim();
      if (!cleaned) continue;
      working = redistributePage(working, page, cleaned);
    }

    return NextResponse.json({
      captions: working,
      pageCount: pages.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Translation failed.";
    console.error("/api/translate failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function translateStrings({
  strings,
  targetLanguage,
  apiKey,
}: {
  strings: string[];
  targetLanguage: string;
  apiKey: string;
}) {
  const system = [
    `You are a native ${targetLanguage} speaker localizing short-form video captions, not a dictionary.`,
    "Translate the MEANING and FEELING, not the words. Rewrite each segment the way a native speaker would actually say it — natural, idiomatic, conversational.",
    "Use slang, idioms, and colloquial phrasing when the source is casual. Match the speaker's energy (hype, chill, sarcastic, dramatic, etc.) even if that means choosing different words than the literal ones.",
    "Do NOT translate word-for-word. Avoid stiff, textbook, or overly formal phrasing unless the source is clearly formal. If a literal translation would sound awkward or bookish to a native speaker, rephrase it.",
    "You may reorder words, swap idioms for their local equivalent, or restructure a sentence so it flows naturally — as long as the overall meaning and vibe of that segment are preserved.",
    "Keep proper nouns, brand names, and well-known English terms unchanged unless they have a common localized form. Keep segment count identical: exactly one translation per input, same order, no merging, no splitting, no commentary.",
    "Respond with only a JSON object of the shape {\"segments\":[string,string,...]}.",
  ].join(" ");

  const user = strings
    .map((s, i) => `${i + 1}. ${s.replace(/\s+/g, " ").trim()}`)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const snippet = text.slice(0, 200);
    throw new Error(
      `OpenAI ${res.status}: ${snippet || res.statusText || "unknown error"}`,
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Could not parse translator response as JSON.");
  }

  const segments = (parsed as { segments?: unknown }).segments;
  if (!Array.isArray(segments)) {
    throw new Error("Translator response missing 'segments' array.");
  }

  return segments.map((s) => (typeof s === "string" ? s : ""));
}
