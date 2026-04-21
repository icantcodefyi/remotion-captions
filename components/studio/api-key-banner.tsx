"use client";

import * as React from "react";
import { KeyRound, ChevronRight } from "lucide-react";

type Props = {
  onClick: () => void;
};

export const ApiKeyBanner: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left flex items-start gap-3 p-3 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-glow)]/10 hover:bg-[var(--color-accent-glow)]/15 transition-colors"
    >
      <div className="h-8 w-8 rounded-md bg-[var(--color-background)]/60 border border-[var(--color-border-strong)] flex items-center justify-center shrink-0">
        <KeyRound className="h-3.5 w-3.5 text-[var(--color-accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-[var(--color-foreground)]">
          Connect Deepgram to generate captions
        </div>
        <div className="text-[11px] text-[var(--color-muted)] mt-0.5 leading-relaxed">
          Paste your API key — stored locally in this browser.
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] self-center" />
    </button>
  );
};
