"use client";

import { type FC, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement>;

export const SectionLabel: FC<Props> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "flex items-baseline gap-2 text-[0.6875rem] uppercase tracking-[0.14em] font-semibold text-[color:var(--muted)]",
      className,
    )}
    {...props}
  >
    <span
      aria-hidden
      className="block h-px w-3 bg-[color:var(--border-strong)]"
    />
    <span>{children}</span>
  </div>
);
