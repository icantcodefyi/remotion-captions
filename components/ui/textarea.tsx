"use client";

import { type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
};

export const Textarea = ({ ref, className, ...props }: Props) => (
  <textarea
    ref={ref}
    className={cn(
      "block w-full rounded-lg px-3.5 py-3",
      "border border-[color:var(--border)]",
      "bg-[var(--surface-1)] text-[color:var(--fg)]",
      "text-[0.875rem] leading-relaxed",
      "placeholder:text-[color:var(--muted)]",
      "focus:border-[color:var(--accent)] focus:outline-none",
      "focus:ring-[3px] focus:ring-[color:var(--accent-glow)]",
      "resize-none transition-colors duration-200",
      "shadow-[inset_0_1px_2px_oklch(20%_0.02_90/0.04)]",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      className,
    )}
    {...props}
  />
);
