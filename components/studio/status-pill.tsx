"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Status = "idle" | "running" | "ready" | "error";

type Props = {
  status: Status;
  label: string;
};

const STATUS_CLASSES: Record<Status, string> = {
  idle: "bg-[var(--color-surface-3)] text-[var(--color-muted)]",
  running: "bg-[var(--color-accent-glow)]/20 text-[var(--color-accent)]",
  ready: "bg-[#26c76d]/15 text-[#3BE6A6]",
  error: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
};

const DOT_CLASSES: Record<Status, string> = {
  idle: "bg-[var(--color-muted)]",
  running: "bg-[var(--color-accent)] pulse-dot",
  ready: "bg-[#3BE6A6]",
  error: "bg-[var(--color-danger)]",
};

export const StatusPill: React.FC<Props> = ({ status, label }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium tracking-tight",
      STATUS_CLASSES[status],
    )}
  >
    <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[status])} />
    {label}
  </div>
);
