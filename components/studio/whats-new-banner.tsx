"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import {
  CHANGELOG_SEEN_STORAGE_KEY,
  CHANGELOG_VERSION,
  changelogFeatureCount,
  whatsNewBanner,
} from "@/lib/changelog";
import { cn } from "@/lib/cn";

const SHOW_DELAY_MS = 700;

export function WhatsNewBanner() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
      if (seenVersion === CHANGELOG_VERSION) {
        return;
      }
    } catch {}

    const timeout = window.setTimeout(() => {
      setReady(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [ready]);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, CHANGELOG_VERSION);
    } catch {}
  }, []);

  useEffect(() => {
    if (!visible) return;
    markSeen();
    const timeout = window.setTimeout(() => setSettled(true), 560);
    return () => window.clearTimeout(timeout);
  }, [visible, markSeen]);

  const dismiss = useCallback(() => {
    setSettled(false);
    setVisible(false);
    window.setTimeout(() => setReady(false), 220);
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[var(--z-toast)] md:left-auto md:right-10 md:w-[360px] lg:right-14">
      <aside
        className={cn(
          "pointer-events-auto panel group relative overflow-hidden p-4 will-change-transform",
          "transition-[opacity,transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)]",
          "[@media(hover:hover)]:hover:-translate-y-[1px] [@media(hover:hover)]:hover:shadow-[var(--shadow-pop)]",
          visible
            ? "banner-enter translate-x-0 translate-y-0 scale-100 opacity-100"
            : "translate-x-3 -translate-y-2 scale-[0.985] opacity-0",
        )}
        aria-live="polite"
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-4 top-0 h-px origin-right",
            "bg-[linear-gradient(to_right,transparent,color-mix(in_oklab,var(--accent)_58%,transparent),transparent)]",
            "transition-transform duration-500 ease-[var(--ease-out-expo)]",
            settled ? "scale-x-100" : "scale-x-0",
          )}
        />
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              "transition-transform duration-300 ease-[var(--ease-out-soft)]",
              "[@media(hover:hover)]:group-hover:scale-[1.04]",
            )}
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-edge)",
              boxShadow: "0 6px 18px -10px var(--accent-glow)",
            }}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-xl bg-[color:var(--accent-glow)] blur-[10px]",
                "transition-opacity duration-300",
                settled ? "opacity-60" : "opacity-0",
              )}
            />
            <Sparkles
              className={cn(
                "relative h-4 w-4 transition-transform duration-300 ease-[var(--ease-out-soft)]",
                settled && "rotate-[8deg]",
                "[@media(hover:hover)]:group-hover:rotate-[14deg]",
              )}
              style={{ color: "var(--accent-ink)" }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--accent-ink)]">
                {whatsNewBanner.eyebrow}
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[color:var(--muted)] transition-[color,background,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-[var(--surface-2)] hover:text-[color:var(--fg)] hover:scale-[1.03]"
                aria-label="Dismiss whats new banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="display mt-2 text-balance text-[1.15rem] leading-[1.02] tracking-[-0.03em] text-[color:var(--fg)]">
              {whatsNewBanner.title}
            </h2>

            <p className="mt-2 text-[0.82rem] leading-6 text-[color:var(--fg-weak)]">
              {whatsNewBanner.description}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="tnum-serif text-[0.78rem] text-[color:var(--muted)]">
                {String(changelogFeatureCount).padStart(2, "0")} things you can
                do today
              </span>
              <Link
                href="/changelog"
                onClick={markSeen}
                className="inline-flex h-8 items-center justify-center rounded-full border border-[color:var(--accent-edge)] bg-[var(--accent)] px-3 text-[0.74rem] font-semibold text-[color:var(--accent-deep)] shadow-[0_6px_18px_-10px_var(--accent-glow)] transition-[transform,filter,box-shadow] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-px hover:brightness-[1.03] hover:shadow-[0_10px_24px_-12px_var(--accent-glow)]"
              >
                {whatsNewBanner.cta}
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
