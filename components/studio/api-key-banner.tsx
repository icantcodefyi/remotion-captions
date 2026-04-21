"use client";

import * as React from "react";
import { ChevronRight, KeyRound } from "lucide-react";

type Props = {
  onClick: () => void;
};

export const ApiKeyBanner: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full text-left flex items-start gap-3 p-3 rounded-xl",
        "border border-[color:var(--accent-edge)]",
        "bg-[var(--accent-soft)]",
        "transition-[background,transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "[@media(hover:hover)]:hover:bg-[color-mix(in_oklab,var(--accent-soft)_80%,var(--accent))]",
        "[@media(hover:hover)]:hover:-translate-y-[1px]",
        "[@media(hover:hover)]:hover:shadow-[0_10px_22px_-12px_var(--accent-glow)]",
      ].join(" ")}
    >
      <div
        className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center"
        style={{
          background: "var(--surface-1)",
          border:
            "1px solid color-mix(in oklab, var(--accent) 30%, transparent)",
          boxShadow: "0 1px 2px oklch(20% 0.02 90 / 0.06)",
        }}
      >
        <KeyRound
          className="h-[14px] w-[14px]"
          style={{ color: "var(--accent-ink)" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-semibold text-[color:var(--fg)] leading-snug">
          Connect Deepgram to start captioning
        </div>
        <div className="text-[0.75rem] text-[color:var(--fg-weak)] mt-1 leading-relaxed">
          <span className="ital-label">Your key stays in this browser.</span>{" "}
          We pass it along only when you hit generate.
        </div>
      </div>
      <ChevronRight
        className="h-4 w-4 self-center text-[color:var(--muted)] transition-transform [@media(hover:hover)]:group-hover:translate-x-0.5 [@media(hover:hover)]:group-hover:text-[color:var(--accent-ink)]"
        aria-hidden
      />
    </button>
  );
};
