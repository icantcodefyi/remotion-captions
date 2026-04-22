"use client";

import {
  type CSSProperties,
  type FC,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PlayerRef } from "@remotion/player";
import type { Caption } from "@remotion/captions";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CaptionPosition, CaptionStyleId, StyleOptions } from "@/lib/types";
import {
  buildPages,
  redistributePage,
  type CaptionPage,
} from "@/lib/caption-pages";
import { getInlineCaptionAppearance } from "@/lib/inline-caption-style";

type Props = {
  captions: Caption[];
  onCaptionsChange: (next: Caption[]) => void;
  playerRef: RefObject<PlayerRef | null>;
  fps: number;
  position: CaptionPosition;
  wordsPerPage: number;
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  compositionWidth: number;
  onEditingPageChange: (pageIndex: number | null) => void;
};

export const CaptionInlineEditor: FC<Props> = ({
  captions,
  onCaptionsChange,
  playerRef,
  fps,
  position,
  wordsPerPage,
  styleId,
  styleOptions,
  compositionWidth,
  onEditingPageChange,
}) => {
  const [currentMs, setCurrentMs] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const draftRef = useRef<string>("");
  const editorRef = useRef<HTMLDivElement>(null);

  const pages = useMemo<CaptionPage[]>(
    () => buildPages(captions, wordsPerPage),
    [captions, wordsPerPage],
  );

  // rAF poll keeps currentMs accurate for hit-zone visibility regardless of
  // Remotion event timing.
  useEffect(() => {
    let rafId = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const player = playerRef.current;
      if (player) {
        try {
          const frame = player.getCurrentFrame();
          const ms = (frame / fps) * 1000;
          setCurrentMs((prev) => (Math.abs(prev - ms) > 16 ? ms : prev));
        } catch {
          // ignore
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [playerRef, fps]);

  const activeIndex = useMemo(() => {
    if (editingIndex != null) return editingIndex;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (currentMs >= p.startMs && currentMs < p.endMs) return i;
    }
    return -1;
  }, [pages, currentMs, editingIndex]);

  useEffect(() => {
    onEditingPageChange(editingIndex);
  }, [editingIndex, onEditingPageChange]);

  const findPageIndexAt = useCallback(
    (ms: number): number => {
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (ms >= p.startMs && ms < p.endMs) return i;
      }
      return -1;
    },
    [pages],
  );

  const activatePage = useCallback(
    (e: { preventDefault?: () => void; stopPropagation?: () => void }) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      const player = playerRef.current;
      if (!player) return;
      let nowMs = currentMs;
      try {
        nowMs = (player.getCurrentFrame() / fps) * 1000;
      } catch {
        // ignore
      }
      const idx = findPageIndexAt(nowMs);
      if (idx >= 0) {
        player.pause();
        draftRef.current = pages[idx].text;
        setEditingIndex(idx);
      } else {
        player.toggle();
      }
    },
    [playerRef, fps, findPageIndexAt, pages, currentMs],
  );

  const commit = useCallback(() => {
    if (editingIndex == null) return;
    const page = pages[editingIndex];
    if (!page) {
      setEditingIndex(null);
      return;
    }
    const cleaned = draftRef.current.trim().replace(/\s+/g, " ");
    if (cleaned === page.text.trim()) {
      setEditingIndex(null);
      return;
    }
    const next = redistributePage(captions, page, cleaned);
    onCaptionsChange(next);
    setEditingIndex(null);
  }, [editingIndex, pages, captions, onCaptionsChange]);

  const cancel = useCallback(() => {
    setEditingIndex(null);
  }, []);

  // Seed the contenteditable with the page text exactly once when editing
  // begins, then leave the DOM alone so typing (including spaces) isn't
  // stomped on by React re-renders.
  useEffect(() => {
    if (editingIndex == null) return;
    const node = editorRef.current;
    if (!node) return;
    node.textContent = pages[editingIndex]?.text ?? "";
    draftRef.current = node.textContent;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    // Only re-seed when we enter edit mode for a given page — intentionally
    // excludes `pages` so typing doesn't reset the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex]);

  const zoneStyle = buildZoneStyle(position, compositionWidth);

  const hasActive = activeIndex >= 0;

  if (editingIndex != null && pages[editingIndex]) {
    const appearance = getInlineCaptionAppearance(
      styleId,
      styleOptions,
      compositionWidth,
    );
    const editable = (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Edit caption"
        spellCheck={false}
        onInput={(e) => {
          draftRef.current = e.currentTarget.textContent ?? "";
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        className="outline-none max-w-full break-words"
        style={{
          ...appearance.textStyle,
          whiteSpace: "pre-wrap",
          caretColor: styleOptions.accentColor,
          boxShadow: `inset 0 -2px 0 ${styleOptions.accentColor}`,
        }}
      />
    );

    // Match the Remotion caption frame's inner width (e.g. 80% for Minimal,
    // 92% for Hormozi) so line-wrap happens at the same place as on render.
    const frameScale = appearance.frameWidthPct / 92;
    const inner = appearance.wrapperStyle ? (
      <div
        style={{
          ...appearance.wrapperStyle,
          maxWidth: `${frameScale * 100}%`,
        }}
      >
        {editable}
      </div>
    ) : (
      <div style={{ maxWidth: `${frameScale * 100}%` }}>{editable}</div>
    );

    const content =
      appearance.leadingDecoration === "broadcast-bar" ? (
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              width: 14,
              background: styleOptions.accentColor,
              flexShrink: 0,
            }}
          />
          {inner}
        </div>
      ) : (
        inner
      );

    return (
      <div
        className="absolute flex z-20"
        style={{
          ...zoneStyle,
          pointerEvents: "auto",
          alignItems:
            appearance.textAlign === "left" ? "flex-start" : "center",
          justifyContent: "center",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={
        hasActive
          ? `Edit caption: ${pages[activeIndex].text}`
          : "Click to play or pause"
      }
      onPointerDown={(e) => activatePage(e)}
      onClick={(e) => e.preventDefault()}
      title={hasActive ? "Click to edit this caption" : undefined}
      className={cn(
        "absolute cursor-pointer group rounded-lg p-0 m-0 appearance-none select-none touch-none",
        "transition-[box-shadow,background,opacity] duration-200",
        "bg-transparent border-0",
        hasActive &&
          "[@media(hover:hover)]:hover:bg-white/[0.05] [@media(hover:hover)]:hover:shadow-[inset_0_0_0_1px_var(--accent-edge),0_0_22px_var(--accent-glow)]",
        "focus-visible:outline-[color:var(--accent)]",
      )}
      style={{
        ...zoneStyle,
        pointerEvents: "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
        zIndex: 5,
      }}
    >
      {hasActive ? (
        <span
          aria-hidden
          className={cn(
            "absolute top-2 right-2",
            "opacity-0",
            "[@media(hover:hover)]:group-hover:opacity-95",
            "[@media(hover:hover)]:group-hover:-translate-y-[1px]",
            "transition-[opacity,transform] duration-200",
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
            "bg-[color-mix(in_oklab,var(--accent)_92%,transparent)]",
            "text-[color:var(--accent-deep)]",
            "text-[0.65rem] font-semibold uppercase tracking-[0.08em]",
            "shadow-[0_2px_10px_-2px_rgba(0,0,0,0.35)]",
          )}
        >
          <Pencil className="h-2.5 w-2.5" />
          edit
        </span>
      ) : null}
    </button>
  );
};

/**
 * Mirrors the edge-anchoring logic in `remotion/styles/types.ts::captionFrameStyle`.
 */
function buildZoneStyle(
  position: CaptionPosition,
  _compositionWidth: number,
): CSSProperties {
  const y = position.y;
  const widthPct = 92;
  const heightPct = 48;
  const common = {
    left: `${position.x * 100}%`,
    top: `${y * 100}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
    containerType: "inline-size",
  } satisfies Partial<CSSProperties>;
  if (y >= 0.6) {
    return { ...common, transform: "translate(-50%, -100%)" };
  }
  if (y <= 0.4) {
    return { ...common, transform: "translate(-50%, 0%)" };
  }
  return { ...common, transform: "translate(-50%, -50%)" };
}
