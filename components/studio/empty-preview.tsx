"use client";

import Image from "next/image";
import { ArrowDownLeft } from "lucide-react";

type Props = {
  mode?: "empty" | "needs-source";
};

export function EmptyPreview({ mode = "empty" }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center text-center px-8 fade-rise">
      <div className="max-w-[28rem]">
        <div className="relative inline-flex mb-6">
          <div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
            style={{ background: "var(--accent-glow)" }}
            aria-hidden
          />
          <div
            className="relative h-20 w-24 items-center justify-center rounded-2xl inline-flex overflow-hidden"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              boxShadow:
                "0 8px 22px -12px var(--accent-glow), inset 0 1px 0 oklch(100% 0 0 / 0.6)",
            }}
          >
            <Image
              src="/cat-spill.png"
              alt=""
              width={84}
              height={58}
              priority
              className="h-auto w-[4.75rem] object-contain logo-invert"
            />
          </div>
        </div>

        <h2 className="display text-[1.75rem] font-medium text-balance text-[color:var(--fg)] leading-[1.1]">
          {mode === "needs-source" ? "Add the matching clip." : "Drop a clip."}
          <span className="block ital-label font-normal text-[color:var(--muted)] text-[1.25rem] mt-1">
            {mode === "needs-source"
              ? "Your subtitles are ready."
              : "We'll do the rest."}
          </span>
        </h2>

        <p className="text-[0.875rem] text-[color:var(--fg-weak)] mt-4 leading-relaxed text-pretty mx-auto max-w-[28ch]">
          {mode === "needs-source"
            ? "Import worked. Drop the source video or audio on the left to preview timing, style it, and re-align edits if needed."
            : "Upload on the left. We'll transcribe with word-level timing, then hand you eight styles to try on."}
        </p>

        <div className="mt-6 inline-flex items-center gap-1.5 text-[0.7rem] text-[color:var(--muted)] ital-label">
          <ArrowDownLeft className="h-3 w-3" />
          start in the source panel
        </div>
      </div>
    </div>
  );
}
