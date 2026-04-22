"use client";

import { cn } from "@/lib/cn";

type Status = "idle" | "running" | "ready" | "error";

type Props = {
  status: Status;
  label: string;
};

const STATUS_CLASSES: Record<Status, string> = {
  idle:
    "bg-[var(--surface-2)] text-[color:var(--muted)] border border-[color:var(--border)]",
  running:
    "bg-[var(--accent-soft)] text-[color:var(--accent-ink)] border border-[color:var(--accent-edge)]",
  ready:
    "bg-[var(--success-soft)] text-[color:var(--success)] border border-[color:color-mix(in_oklab,var(--success)_30%,transparent)]",
  error:
    "bg-[var(--danger-soft)] text-[color:var(--danger)] border border-[color:color-mix(in_oklab,var(--danger)_30%,transparent)]",
};

const DOT_CLASSES: Record<Status, string> = {
  idle: "bg-[var(--muted-soft)]",
  running: "bg-[var(--accent)] pulse-dot",
  ready: "bg-[var(--success)]",
  error: "bg-[var(--danger)]",
};

export function StatusPill({ status, label }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full",
        "text-[0.7rem] font-semibold tracking-tight",
        "transition-colors duration-300",
        STATUS_CLASSES[status],
      )}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[status])}
      />
      {label}
    </div>
  );
}
