"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

export const EmptyPreview: React.FC = () => (
  <div className="flex-1 flex items-center justify-center text-center px-8">
    <div className="max-w-md">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-5 shadow-[0_0_40px_var(--color-accent-glow)]">
        <Sparkles className="h-6 w-6 text-[var(--color-accent)]" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-balance">
        Drop a clip to get started
      </h2>
      <p className="text-sm text-[var(--color-muted)] mt-3 leading-relaxed text-balance">
        Upload a video on the left. We&apos;ll transcribe it with word-level
        timing, then let you style the captions any way you like.
      </p>
    </div>
  </div>
);
