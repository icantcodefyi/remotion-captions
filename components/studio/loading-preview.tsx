"use client";

import Image from "next/image";

type Mode = "transcribe" | "align";

const MESSAGES: Record<Mode, { message: string; detail: string }> = {
  transcribe: {
    message: "Listening to your video",
    detail: "Finding the right timing for each word. Usually 20–60 seconds.",
  },
  align: {
    message: "Snapping your script to audio",
    detail:
      "Matching your words to the transcript's timing so the captions read exactly as you wrote them.",
  },
};

type Props = { mode: Mode };

export function LoadingPreview({ mode }: Props) {
  const { message, detail } = MESSAGES[mode];
  return (
    <div
      className="flex-1 flex items-center justify-center text-center px-8 fade-rise"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[28rem] flex flex-col items-center">
        <div className="mb-3 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <Image
            src="/cat-loader.gif"
            alt=""
            aria-hidden
            width={200}
            height={150}
            className="block h-auto w-[200px] select-none rounded-xl"
            draggable={false}
            unoptimized
          />
        </div>
        <div className="text-[0.9375rem] font-semibold text-[color:var(--fg)]">
          {message}
        </div>
        <div className="text-[0.8125rem] text-[color:var(--muted)] mt-2 leading-relaxed max-w-[36ch]">
          {detail}
        </div>
      </div>
    </div>
  );
}
