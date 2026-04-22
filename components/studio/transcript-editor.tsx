"use client";

import {
  type FC,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PlayerRef } from "@remotion/player";
import type { Caption } from "@remotion/captions";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { SectionLabel } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/caption-edits";
import {
  buildPages,
  buildPagesFromBreaks,
  redistributePage,
  type CaptionPage,
} from "@/lib/caption-pages";
import { extractPeaks, type WaveformPeaks } from "@/lib/waveform";
import { TranscriptWaveform } from "./transcript-waveform";

type Props = {
  captions: Caption[];
  onCaptionsChange: (next: Caption[]) => void;
  file: File | null;
  playerRef: RefObject<PlayerRef | null>;
  durationMs: number;
  fps: number;
  wordsPerPage: number;
  /** Explicit page boundaries derived from a hard-break delimiter in the script. */
  forcedBreaks?: number[] | null;
};

const UNDO_LIMIT = 50;
const AUTOSCROLL_COOLDOWN_MS = 1600;

export const TranscriptEditor: FC<Props> = ({
  captions,
  onCaptionsChange,
  file,
  playerRef,
  durationMs,
  fps,
  wordsPerPage,
  forcedBreaks,
}) => {
  const [peaksFor, setPeaksFor] = useState<File | null>(null);
  const [peaks, setPeaks] = useState<WaveformPeaks | null>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [undoDepth, setUndoDepth] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<Caption[][]>([]);
  const lastManualScrollAt = useRef(0);
  const captionsRef = useRef(captions);

  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);

  const pages = useMemo<CaptionPage[]>(
    () =>
      forcedBreaks && forcedBreaks.length > 0
        ? buildPagesFromBreaks(captions, forcedBreaks)
        : buildPages(captions, wordsPerPage),
    [captions, wordsPerPage, forcedBreaks],
  );

  const activePageIndex = useMemo(() => {
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (currentMs >= p.startMs && currentMs < p.endMs) return i;
    }
    return -1;
  }, [pages, currentMs]);

  // Load waveform peaks when file changes
  useEffect(() => {
    if (!file) return;
    const controller = new AbortController();
    let cancelled = false;
    extractPeaks(file, 1200, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setPeaks(result);
        setPeaksFor(file);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = (err as { name?: string } | null)?.name;
        if (name === "AbortError") return;
        toast.message("Waveform unavailable", {
          description: "The audio track couldn't be decoded in this browser.",
        });
        setPeaksFor(file);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [file]);

  const peaksReady = peaksFor === file && peaks != null;
  const peaksLoading = Boolean(file) && peaksFor !== file;
  const effectivePeaks = peaksReady ? peaks : null;

  // Track player time via frameupdate events (cheap since we only need
  // to know which page is active, not sub-frame precision)
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = ({ detail }: { detail: { frame: number } }) => {
      setCurrentMs((detail.frame / fps) * 1000);
    };
    const onSeek = ({ detail }: { detail: { frame: number } }) => {
      setCurrentMs((detail.frame / fps) * 1000);
    };
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onSeek);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onSeek);
    };
  }, [playerRef, fps]);

  const applyChange = useCallback(
    (next: Caption[]) => {
      undoStack.current.push(captionsRef.current);
      if (undoStack.current.length > UNDO_LIMIT) undoStack.current.shift();
      setUndoDepth(undoStack.current.length);
      onCaptionsChange(next);
    },
    [onCaptionsChange],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    setUndoDepth(undoStack.current.length);
    if (!prev) {
      toast.message("Nothing to undo");
      return;
    }
    onCaptionsChange(prev);
    toast.message("Undone");
  }, [onCaptionsChange]);

  const seekToMs = useCallback(
    (ms: number) => {
      const player = playerRef.current;
      if (!player) return;
      player.seekTo(Math.max(0, Math.round((ms / 1000) * fps)));
    },
    [playerRef, fps],
  );

  const selectPage = useCallback(
    (index: number) => {
      const p = pages[index];
      if (!p) return;
      seekToMs(p.startMs);
    },
    [pages, seekToMs],
  );

  const deletePage = useCallback(
    (index: number) => {
      const p = pages[index];
      if (!p) return;
      const next = [
        ...captionsRef.current.slice(0, p.startIndex),
        ...captionsRef.current.slice(p.endIndex + 1),
      ];
      applyChange(next);
      setEditingIndex(-1);
    },
    [pages, applyChange],
  );

  const commitPageText = useCallback(
    (index: number, text: string) => {
      const p = pages[index];
      if (!p) return;
      const cleaned = text.trim();
      if (cleaned === p.text.trim()) {
        setEditingIndex(-1);
        return;
      }
      applyChange(redistributePage(captionsRef.current, p, cleaned));
      setEditingIndex(-1);
    },
    [pages, applyChange],
  );

  // Auto-scroll active page into view
  useEffect(() => {
    const node = listRef.current;
    if (!node || activePageIndex < 0) return;
    if (Date.now() - lastManualScrollAt.current < AUTOSCROLL_COOLDOWN_MS) return;
    const rows = node.querySelectorAll<HTMLElement>("[data-page-row]");
    const row = rows[activePageIndex];
    if (!row) return;
    const nodeRect = node.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (
      rowRect.top < nodeRect.top + 20 ||
      rowRect.bottom > nodeRect.bottom - 20
    ) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activePageIndex]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SectionLabel>Waveform</SectionLabel>
          <span className="tnum-serif text-[0.7rem] italic text-[color:var(--muted)]">
            {formatTimestamp(currentMs)}
            <span className="not-italic mx-1 opacity-60">/</span>
            {formatTimestamp(durationMs)}
          </span>
        </div>
        <TranscriptWaveform
          peaks={effectivePeaks?.peaks ?? null}
          durationMs={durationMs || effectivePeaks?.durationMs || 1}
          captions={captions}
          currentMs={currentMs}
          activeIndex={pages[activePageIndex]?.startIndex ?? -1}
          isLoading={peaksLoading}
          onSeek={seekToMs}
          onWordSelect={() => {
            /* no-op: page selection happens via rows below */
          }}
        />
      </div>

      <div className="flex flex-col min-h-0 flex-1 gap-2">
        <div className="flex items-center justify-between">
          <SectionLabel>Transcript</SectionLabel>
          <div className="flex items-center gap-2">
            <span className="ital-label text-[0.7rem] text-[color:var(--muted)] normal-case tracking-normal">
              {pages.length} {pages.length === 1 ? "line" : "lines"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={undoDepth === 0}
              title="Undo last change (⌘Z)"
            >
              <Undo2 className="h-[13px] w-[13px]" />
            </Button>
          </div>
        </div>

        {pages.length === 0 ? (
          <EmptyTranscript />
        ) : (
          <div
            ref={listRef}
            onScroll={() => {
              lastManualScrollAt.current = Date.now();
            }}
            role="list"
            aria-label="Transcript lines"
            className={cn(
              "flex-1 min-h-0 overflow-y-auto rounded-md",
              "border border-[color:var(--border)] bg-[var(--surface-2)]",
            )}
            style={{ scrollbarGutter: "stable" }}
          >
            <div className="flex flex-col">
              {pages.map((page, index) => (
                <PageRow
                  key={`${page.startIndex}-${page.startMs}`}
                  page={page}
                  index={index}
                  isActive={index === activePageIndex}
                  isEditing={index === editingIndex}
                  onSelect={selectPage}
                  onBeginEdit={(i) => setEditingIndex(i)}
                  onCommit={commitPageText}
                  onCancelEdit={() => setEditingIndex(-1)}
                  onDelete={deletePage}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <KeyboardLegend />
    </div>
  );
};

type PageRowProps = {
  page: CaptionPage;
  index: number;
  isActive: boolean;
  isEditing: boolean;
  onSelect: (index: number) => void;
  onBeginEdit: (index: number) => void;
  onCommit: (index: number, text: string) => void;
  onCancelEdit: () => void;
  onDelete: (index: number) => void;
};

const PageRow: FC<PageRowProps> = ({
  page,
  index,
  isActive,
  isEditing,
  onSelect,
  onBeginEdit,
  onCommit,
  onCancelEdit,
  onDelete,
}) => {
  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) return;
    const node = editableRef.current;
    if (!node) return;
    node.textContent = page.text;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    // Seed DOM only on edit-mode entry; intentionally omit `page.text` so
    // typing isn't clobbered by re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const wordCount = page.endIndex - page.startIndex + 1;
  const durationSec = ((page.endMs - page.startMs) / 1000).toFixed(1);

  return (
    <div
      role="listitem"
      data-page-row
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "group relative flex items-start gap-3 px-3 py-2.5",
        "border-b border-[color:var(--border)] last:border-b-0",
        "transition-[background,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isActive
          ? "bg-[color-mix(in_oklab,var(--accent-soft)_60%,transparent)]"
          : "[@media(hover:hover)]:hover:bg-[var(--surface-1)]",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(index)}
        title={`Seek to ${formatTimestamp(page.startMs)}`}
        className={cn(
          "relative shrink-0 flex flex-col items-end justify-start gap-0.5",
          "pt-[3px] w-[58px] text-right",
          "cursor-pointer appearance-none bg-transparent border-0 p-0",
          "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
          "transition-colors duration-150",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute -left-1 top-[9px] h-1.5 w-1.5 rounded-full",
            "transition-[opacity,transform] duration-200",
            isActive
              ? "opacity-100 scale-100 bg-[var(--accent)] shadow-[0_0_0_3px_var(--accent-glow)]"
              : "opacity-0 scale-75",
          )}
        />
        <span
          className={cn(
            "tnum-serif text-[0.72rem] italic leading-none",
            isActive
              ? "text-[color:var(--accent-ink)]"
              : "text-[color:var(--muted)]",
          )}
        >
          {formatTimestamp(page.startMs)}
        </span>
        <span className="ital-label text-[0.62rem] normal-case tracking-normal text-[color:var(--muted-soft)] leading-none">
          {durationSec}s · {wordCount}w
        </span>
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={`Edit line at ${formatTimestamp(page.startMs)}`}
            spellCheck={false}
            onBlur={(e) =>
              onCommit(index, e.currentTarget.textContent ?? "")
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onCommit(index, e.currentTarget.textContent ?? "");
              } else if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            className={cn(
              "outline-none rounded px-1.5 py-0.5 -mx-1.5 -my-0.5",
              "text-[0.9375rem] leading-[1.4] font-medium",
              "text-[color:var(--fg)]",
              "bg-[var(--surface-1)]",
              "shadow-[0_0_0_2px_var(--accent-edge),0_0_0_6px_var(--accent-glow)]",
              "whitespace-pre-wrap",
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => onBeginEdit(index)}
            title="Click to edit"
            className={cn(
              "block w-full text-left appearance-none bg-transparent border-0 p-0",
              "text-[0.9375rem] leading-[1.4]",
              "text-[color:var(--fg)]",
              "cursor-text",
            )}
          >
            {page.text}
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label="Delete this line"
        title="Delete line"
        onClick={() => onDelete(index)}
        className={cn(
          "shrink-0 h-6 w-6 inline-flex items-center justify-center rounded",
          "text-[color:var(--muted)]",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          "transition-[background,color,opacity,transform] duration-150",
          "[@media(hover:hover)]:hover:bg-[var(--surface-3)]",
          "[@media(hover:hover)]:hover:text-[color:var(--danger)]",
          "active:scale-95",
        )}
      >
        ×
      </button>
    </div>
  );
};

const EmptyTranscript: FC = () => (
  <div className="flex-1 min-h-0 flex items-center justify-center rounded-md border border-dashed border-[color:var(--border)] p-6">
    <p className="ital-label text-[0.75rem] text-[color:var(--muted)] normal-case tracking-normal text-center">
      run transcription first
      <br />
      edits will show up here
    </p>
  </div>
);

const KeyboardLegend: FC = () => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
    <Hint k="Click">edit line</Hint>
    <Hint k="Enter">save</Hint>
    <Hint k="Esc">cancel</Hint>
  </div>
);

const Hint: FC<{ k: string; children: ReactNode }> = ({ k, children }) => (
  <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-[color:var(--muted)]">
    <kbd
      className={cn(
        "tnum-serif inline-flex items-center px-1.5 py-[1px] rounded",
        "border border-[color:var(--border)] bg-[var(--surface-1)]",
        "text-[0.65rem] not-italic",
      )}
    >
      {k}
    </kbd>
    <span className="ital-label normal-case tracking-normal">{children}</span>
  </span>
);
