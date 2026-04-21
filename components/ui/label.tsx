"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement>;

export const SectionLabel: React.FC<Props> = ({ className, children, ...props }) => (
  <div
    className={cn(
      "text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--color-muted)]",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
