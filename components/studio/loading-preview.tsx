"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

type Props = { message: string; detail?: string };

export const LoadingPreview: React.FC<Props> = ({ message, detail }) => (
  <div className="flex-1 flex items-center justify-center text-center px-8">
    <div className="max-w-md flex flex-col items-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-[var(--color-accent-glow)] blur-xl opacity-60 spin-slow" />
        <div className="relative h-14 w-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-[var(--color-accent)] spin-slow" />
        </div>
      </div>
      <div className="text-sm font-medium">{message}</div>
      {detail ? (
        <div className="text-xs text-[var(--color-muted)] mt-2">{detail}</div>
      ) : null}
    </div>
  </div>
);
