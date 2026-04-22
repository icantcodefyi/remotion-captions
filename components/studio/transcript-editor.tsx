"use client";

import { type FC, type ReactNode, type RefObject, type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import type { Caption } from "@remotion/captions";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { SectionLabel } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  deleteWord,
  findActiveWordIndex,
  formatTimestamp,
  mergeWithNext,
  MIN_WORD_MS,
  retimeWord,
  splitWord,
  updateText,
} from "@/lib/caption-edits";
import { extractPeaks, type WaveformPeaks } from "@/lib/waveform";
import { TranscriptWaveform } from "./transcript-waveform";
import { TranscriptWordRow } from "./transcript-word-row";

type Props = {
  captions: Caption[];
  onCaptionsChange: (next: Caption[]) => void;
  file: File | null;
  playerRef: RefObject<PlayerRef | null>;
  durationMs: number;
  fps: number;
};

const ROW_HEIGHT = 32;
const OVERSCAN = 8;
const UNDO_LIMIT = 50;
const AUTOSCROLL_COOLDOWN_MS = 1600;

export const TranscriptEditor: FC<Props> = ({
  captions,
  onCaptionsChange,
  file,
  playerRef,
  durationMs,
  fps,
}) => {
  const [peaksFor, setPeaksFor] = useState<File | null>(null);
  const [peaks, setPeaks] = useState<WaveformPeaks | null>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(480);
  const [undoDepth, setUndoDepth] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<Caption[][]>([]);
  const lastManualScrollAt = useRef(0);

  const captionsRef = useRef(captions);
  const selectedIndexRef = useRef(selectedIndex);
  const editingIndexRef = useRef(editingIndex);

  useEffect(() => {
    captionsRef.current = captions;
  }, [captions]);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  useEffect(() => {
    editingIndexRef.current = editingIndex;
  }, [editingIndex]);

  const activeIndex = useMemo(
    () => findActiveWordIndex(captions, currentMs),
    [captions, currentMs],
  );

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

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerHeight(e.contentRect.height);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

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

  const selectIndex = useCallback(
    (index: number) => {
      const list = captionsRef.current;
      if (index < 0 || index >= list.length) return;
      setSelectedIndex(index);
      setEditingIndex(-1);
      seekToMs(list[index].startMs);
    },
    [seekToMs],
  );

  const beginEdit = useCallback((index: number) => {
    setSelectedIndex(index);
    setEditingIndex(index);
  }, []);

  const cancelEdit = useCallback(() => setEditingIndex(-1), []);

  const commitEdit = useCallback(
    (index: number, text: string) => {
      const list = captionsRef.current;
      if (text.trim() === list[index]?.text) {
        setEditingIndex(-1);
        return;
      }
      applyChange(updateText(list, index, text));
      setEditingIndex(-1);
    },
    [applyChange],
  );

  const handleDelete = useCallback(
    (index: number) => {
      const list = captionsRef.current;
      applyChange(deleteWord(list, index));
      setEditingIndex(-1);
      setSelectedIndex(Math.min(index, list.length - 2));
    },
    [applyChange],
  );

  const handleSplit = useCallback(
    (index: number, first: string, second: string) => {
      applyChange(splitWord(captionsRef.current, index, first, second));
      setEditingIndex(-1);
      setSelectedIndex(index + 1);
    },
    [applyChange],
  );

  const handleMergeNext = useCallback(
    (index: number) => {
      applyChange(mergeWithNext(captionsRef.current, index));
      setEditingIndex(-1);
    },
    [applyChange],
  );

  const adjustActiveEdge = useCallback(
    (edge: "start" | "end", deltaMs: number) => {
      const index = selectedIndexRef.current;
      const list = captionsRef.current;
      if (index < 0) return;
      const w = list[index];
      if (!w) return;
      applyChange(
        retimeWord(list, index, {
          startMs: edge === "start" ? w.startMs + deltaMs : w.startMs,
          endMs: edge === "end" ? w.endMs + deltaMs : w.endMs,
        }),
      );
    },
    [applyChange],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingIndexRef.current >= 0) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      const index = selectedIndexRef.current;
      if (index < 0) return;
      const list = captionsRef.current;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        selectIndex(Math.min(list.length - 1, index + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        selectIndex(Math.max(0, index - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        beginEdit(index);
      } else if (e.key === " ") {
        e.preventDefault();
        playerRef.current?.toggle();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDelete(index);
      } else if (e.key === "[") {
        e.preventDefault();
        adjustActiveEdge("start", e.shiftKey ? -20 : -80);
      } else if (e.key === "]") {
        e.preventDefault();
        adjustActiveEdge("end", e.shiftKey ? 20 : 80);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, selectIndex, beginEdit, handleDelete, adjustActiveEdge, playerRef]);

  useEffect(() => {
    const node = listRef.current;
    if (!node || activeIndex < 0) return;
    if (Date.now() - lastManualScrollAt.current < AUTOSCROLL_COOLDOWN_MS) return;
    const top = activeIndex * ROW_HEIGHT;
    const viewportTop = node.scrollTop;
    const viewportBottom = viewportTop + node.clientHeight;
    if (top < viewportTop + ROW_HEIGHT || top > viewportBottom - ROW_HEIGHT * 3) {
      node.scrollTo({
        top: Math.max(0, top - node.clientHeight / 2),
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  const totalHeight = captions.length * ROW_HEIGHT;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endRow = Math.min(
    captions.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const visible = captions.slice(startRow, endRow);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    lastManualScrollAt.current = Date.now();
  };

  const selected = selectedIndex >= 0 ? captions[selectedIndex] : null;

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
          activeIndex={activeIndex}
          isLoading={peaksLoading}
          onSeek={seekToMs}
          onWordSelect={(i) => {
            setSelectedIndex(i);
            setEditingIndex(-1);
          }}
        />
      </div>

      <SelectedWordCard
        caption={selected}
        activeIndex={selectedIndex}
        onNudgeStart={(delta) => adjustActiveEdge("start", delta)}
        onNudgeEnd={(delta) => adjustActiveEdge("end", delta)}
        onEdit={() => selectedIndex >= 0 && beginEdit(selectedIndex)}
      />

      <div className="flex flex-col min-h-0 flex-1 gap-2">
        <div className="flex items-center justify-between">
          <SectionLabel>Transcript</SectionLabel>
          <div className="flex items-center gap-2">
            <span className="ital-label text-[0.7rem] text-[color:var(--muted)] normal-case tracking-normal">
              {captions.length} words
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

        {captions.length === 0 ? (
          <EmptyTranscript />
        ) : (
          <div
            ref={listRef}
            onScroll={handleScroll}
            role="listbox"
            aria-label="Transcript words"
            tabIndex={0}
            className={cn(
              "flex-1 min-h-0 overflow-y-auto rounded-md",
              "border border-[color:var(--border)] bg-[var(--surface-2)]",
            )}
            style={{ scrollbarGutter: "stable" }}
          >
            <div style={{ height: totalHeight, position: "relative" }}>
              <div
                style={{
                  transform: `translateY(${startRow * ROW_HEIGHT}px)`,
                }}
              >
                {visible.map((caption, offset) => {
                  const index = startRow + offset;
                  return (
                    <TranscriptWordRow
                      key={`${index}-${caption.startMs}`}
                      caption={caption}
                      index={index}
                      isActive={index === activeIndex}
                      isSelected={index === selectedIndex}
                      isEditing={index === editingIndex}
                      canMerge={index < captions.length - 1}
                      onSelect={selectIndex}
                      onBeginEdit={beginEdit}
                      onCommitEdit={commitEdit}
                      onCancelEdit={cancelEdit}
                      onDelete={handleDelete}
                      onSplit={handleSplit}
                      onMergeNext={handleMergeNext}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <KeyboardLegend />
    </div>
  );
};

const SelectedWordCard: FC<{
  caption: Caption | null;
  activeIndex: number;
  onNudgeStart: (deltaMs: number) => void;
  onNudgeEnd: (deltaMs: number) => void;
  onEdit: () => void;
}> = ({ caption, activeIndex, onNudgeStart, onNudgeEnd, onEdit }) => {
  if (!caption) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-[color:var(--border)]",
          "p-3 bg-transparent",
        )}
      >
        <p className="ital-label text-[0.75rem] text-[color:var(--muted)] normal-case tracking-normal">
          pick a word to retime, split, or rewrite
        </p>
      </div>
    );
  }
  const durationMs = Math.max(MIN_WORD_MS, caption.endMs - caption.startMs);
  return (
    <div
      className={cn(
        "rounded-md p-3 flex flex-col gap-2.5",
        "bg-[var(--surface-2)] border border-[color:var(--border)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="text-left group flex items-baseline gap-2 min-w-0 flex-1"
          title="Edit text"
        >
          <span className="tnum-serif text-[0.7rem] italic text-[color:var(--muted)] shrink-0">
            #{activeIndex + 1}
          </span>
          <span className="text-[0.9375rem] font-semibold text-[color:var(--fg)] truncate group-hover:underline decoration-[color:var(--accent)] underline-offset-4">
            {caption.text}
          </span>
        </button>
        <span className="tnum-serif text-[0.7rem] italic text-[color:var(--muted)] shrink-0">
          {Math.round(durationMs)}ms
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <EdgeNudge
          label="Start"
          valueMs={caption.startMs}
          onNudge={onNudgeStart}
        />
        <EdgeNudge label="End" valueMs={caption.endMs} onNudge={onNudgeEnd} />
      </div>
    </div>
  );
};

const EdgeNudge: FC<{
  label: string;
  valueMs: number;
  onNudge: (deltaMs: number) => void;
}> = ({ label, valueMs, onNudge }) => (
  <div
    className={cn(
      "flex items-center justify-between rounded",
      "bg-[var(--surface-1)] border border-[color:var(--border)] px-2 py-1.5",
    )}
  >
    <div className="flex flex-col">
      <span className="ital-label text-[0.65rem] text-[color:var(--muted)] normal-case tracking-normal">
        {label}
      </span>
      <span className="tnum-serif text-[0.75rem] text-[color:var(--fg)]">
        {formatTimestamp(valueMs)}
      </span>
    </div>
    <div className="flex items-center gap-0.5">
      <NudgeButton onClick={() => onNudge(-40)} title="Nudge -40ms ([)">
        ‹
      </NudgeButton>
      <NudgeButton onClick={() => onNudge(40)} title="Nudge +40ms (])">
        ›
      </NudgeButton>
    </div>
  </div>
);

const NudgeButton: FC<{
  onClick: () => void;
  title: string;
  children: ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "h-6 w-6 rounded inline-flex items-center justify-center",
      "text-[color:var(--muted)]",
      "transition-[background,color,transform] duration-150",
      "[@media(hover:hover)]:hover:bg-[var(--surface-3)]",
      "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
      "active:scale-95",
    )}
  >
    {children}
  </button>
);

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
    <Hint k="↑ ↓">navigate</Hint>
    <Hint k="Enter">edit</Hint>
    <Hint k="[ ]">nudge edges</Hint>
    <Hint k="⌘Z">undo</Hint>
  </div>
);

const Hint: FC<{ k: string; children: ReactNode }> = ({
  k,
  children,
}) => (
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
