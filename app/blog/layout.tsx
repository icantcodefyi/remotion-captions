import type { ReactNode } from "react";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[color:var(--surface-0)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-60"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--surface-2) 60%, transparent), transparent)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
