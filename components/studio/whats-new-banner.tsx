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

  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
      if (seenVersion === CHANGELOG_VERSION) {
        return;
      }
    } catch {}

    const timeout = window.setTimeout(() => {
      setReady(true);
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, CHANGELOG_VERSION);
    } catch {}
  }, []);

  const dismiss = useCallback(() => {
    markSeen();
    setVisible(false);
    window.setTimeout(() => setReady(false), 220);
  }, [markSeen]);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[var(--z-toast)] md:left-auto md:right-5 md:w-[360px]">
      <aside
        className={cn(
          "pointer-events-auto panel overflow-hidden p-4 transition-[opacity,transform] duration-200 ease-[var(--ease-out-soft)]",
          visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-edge)",
              boxShadow: "0 6px 18px -10px var(--accent-glow)",
            }}
          >
            <Sparkles
              className="h-4 w-4"
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
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors duration-200 hover:bg-[var(--surface-2)] hover:text-[color:var(--fg)]"
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
                className="inline-flex h-8 items-center justify-center rounded-full border border-[color:var(--accent-edge)] bg-[var(--accent)] px-3 text-[0.74rem] font-semibold text-[color:var(--accent-deep)] shadow-[0_6px_18px_-10px_var(--accent-glow)] transition-[transform,filter] duration-200 ease-[var(--ease-out-soft)] hover:brightness-[1.03]"
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
