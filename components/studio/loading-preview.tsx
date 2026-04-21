"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

type Mode = "transcribe" | "align";

const MESSAGES: Record<Mode, { message: string; detail: string }> = {
  transcribe: {
    message: "Listening to your audio",
    detail: "Deepgram is pulling out word-level timing. Usually 20–60 seconds.",
  },
  align: {
    message: "Snapping your script to audio",
    detail:
      "Matching your words to the transcript's timing so the captions read exactly as you wrote them.",
  },
};

type Props = { mode: Mode };

export const LoadingPreview: React.FC<Props> = ({ mode }) => {
  const { message, detail } = MESSAGES[mode];
  return (
    <div
      className="flex-1 flex items-center justify-center text-center px-8 fade-rise"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[28rem] flex flex-col items-center">
        <div className="relative mb-5">
          <div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-80 spin-slow"
            style={{ background: "var(--accent-glow)" }}
            aria-hidden
          />
          <div
            className="relative h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <Loader2 className="h-6 w-6 text-[color:var(--accent-ink)] spin-slow" />
          </div>
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
};
