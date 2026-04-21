"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none",
    "disabled:opacity-50 disabled:pointer-events-none",
    "transition-[transform,background,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "active:scale-[0.985]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--accent)] text-[color:var(--accent-deep)]",
          "border border-[color:var(--accent-edge)]",
          "shadow-[0_8px_22px_-12px_var(--accent-glow),inset_0_1px_0_oklch(100%_0_0/0.35)]",
          "font-semibold",
          "[@media(hover:hover)]:hover:-translate-y-[1px]",
          "[@media(hover:hover)]:hover:brightness-[1.04]",
        ].join(" "),
        secondary: [
          "bg-[var(--surface-1)] text-[color:var(--fg)]",
          "border border-[color:var(--border)]",
          "shadow-[var(--shadow-soft)]",
          "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
          "[@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
          "[@media(hover:hover)]:hover:-translate-y-[1px]",
        ].join(" "),
        ghost: [
          "bg-transparent text-[color:var(--fg-weak)]",
          "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
          "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
        ].join(" "),
        danger: [
          "bg-[var(--danger)] text-white",
          "[@media(hover:hover)]:hover:brightness-[1.05]",
          "shadow-[0_8px_22px_-12px_color-mix(in_oklab,var(--danger)_55%,transparent)]",
        ].join(" "),
      },
      size: {
        /* Touch-target padding kicks in on coarse pointers */
        sm: "h-8 px-3 text-[0.75rem] rounded-md [@media(pointer:coarse)]:h-10",
        md: "h-10 px-4 text-[0.8125rem] rounded-lg [@media(pointer:coarse)]:h-11",
        lg: "h-12 px-5 text-[0.9375rem] rounded-xl",
        icon: "h-9 w-9 rounded-lg p-0 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
