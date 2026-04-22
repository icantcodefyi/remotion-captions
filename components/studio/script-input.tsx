"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import type { Caption } from "@remotion/captions";
import { RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import {
  DELIMITER_LIST,
  joinCaptions,
  type Delimiter,
  type DelimiterId,
} from "@/lib/delimiter";

type Props = {
  script: string;
  onScriptChange: (v: string) => void;
  captions: Caption[] | null;
  breaks: number[];
  delimiter: Delimiter;
  onDelimiterChange: (id: DelimiterId) => void;
  onReAlign: () => void;
  isAligning: boolean;
  generationMode: "align" | "transcribe" | "import";
  hasSourceMedia: boolean;
  disabled?: boolean;
};

const MIN_ROWS = 5;
const MAX_HEIGHT_PX = 260;

export function ScriptInput({
  script,
  onScriptChange,
  captions,
  breaks,
  delimiter,
  onDelimiterChange,
  onReAlign,
  isAligning,
  generationMode,
  hasSourceMedia,
  disabled,
}: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const taRef = useRef<HTMLTextAreaElement>(null);

  const hasCaptions = Boolean(captions && captions.length > 0);

  const canonical = useMemo(
    () => (hasCaptions ? joinCaptions(captions!, delimiter, breaks) : ""),
    [captions, delimiter, breaks, hasCaptions],
  );
  const isDirty = hasCaptions && normalize(script) !== normalize(canonical);
  const canReAlign = hasSourceMedia && isDirty && !isAligning && !disabled;

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT_PX) + "px";
  }, [script, hasCaptions, delimiter.id]);

  if (!hasCaptions) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <SectionLabel>
            Script
            <span className="ital-label normal-case tracking-normal text-[0.7rem] text-[color:var(--muted-soft)]">
              optional
            </span>
          </SectionLabel>
          <span className="text-[0.7rem] text-[color:var(--muted)] ital-label">
            matched to your video
          </span>
        </div>
        <Textarea
          ref={taRef}
          id={id}
          aria-describedby={hintId}
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder="Paste the exact words your video should show. Leave blank to auto-transcribe."
          rows={MIN_ROWS}
          disabled={disabled}
          style={{ maxHeight: MAX_HEIGHT_PX }}
        />
        <p
          id={hintId}
          className="text-[0.75rem] text-[color:var(--muted)] leading-relaxed"
        >
          When you provide a script we transcribe for timing, then snap your
          exact words on top so captions read exactly as written.
        </p>
      </div>
    );
  }

  const wordCount = captions!.length;
  const totalSec = ((captions![wordCount - 1]?.endMs ?? 0) / 1000).toFixed(1);

  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <SectionLabel>Transcript</SectionLabel>
        <span className="tnum-serif text-[0.7rem] italic text-[color:var(--muted)] truncate shrink">
          {wordCount}w
          <span className="not-italic mx-1 opacity-60">·</span>
          {totalSec}s
          <span className="not-italic mx-1 opacity-60">·</span>
          <span className="ital-label not-italic normal-case tracking-normal text-[color:var(--muted-soft)]">
            {generationMode === "align"
              ? "aligned"
              : generationMode === "import"
                ? "imported"
                : "auto"}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <Segmented<DelimiterId>
          value={delimiter.id}
          onChange={onDelimiterChange}
          ariaLabel="Line delimiter"
          size="sm"
          options={DELIMITER_LIST.map((d) => ({
            value: d.id,
            label: (
              <span
                aria-label={d.label}
                className="font-mono text-[0.85rem] leading-none inline-flex items-center justify-center min-w-[12px]"
              >
                {d.glyph}
              </span>
            ),
          }))}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onReAlign}
          disabled={!canReAlign}
          title={
            !hasSourceMedia
              ? "Add a source clip to re-align timing"
              : isDirty
                ? "Re-align captions to the edited transcript"
                : "No changes to align"
          }
          aria-label="Re-align captions"
          className={cn(
            "ml-auto shrink-0 px-2.5",
            canReAlign &&
              "text-[color:var(--accent-ink)] [@media(hover:hover)]:hover:bg-[var(--accent-soft)]",
          )}
        >
          {isAligning ? (
            <span className="h-3 w-3 rounded-full border-2 border-[color:var(--accent-deep)]/20 border-t-[color:var(--accent-deep)] spin-slow" />
          ) : (
            <RotateCcw className="h-[13px] w-[13px]" />
          )}
          <span>Re-align</span>
        </Button>
      </div>

      <Textarea
        ref={taRef}
        id={id}
        aria-describedby={hintId}
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        rows={MIN_ROWS}
        disabled={disabled || isAligning}
        spellCheck={false}
        style={{ maxHeight: MAX_HEIGHT_PX }}
        className={cn(
          "font-normal",
          isDirty &&
            "border-[color:var(--accent-edge)] shadow-[inset_0_1px_2px_oklch(20%_0.02_90/0.04),0_0_0_3px_var(--accent-glow)]",
        )}
      />

      <p
        id={hintId}
        className="text-[0.7rem] text-[color:var(--muted)] leading-relaxed"
      >
        {!hasSourceMedia ? (
          <>Add a source clip to re-align transcript edits back to audio timing.</>
        ) : isDirty ? (
          <>
            Unsaved edits.{" "}
            <span className="text-[color:var(--accent-ink)]">Re-align</span> to
            snap timings.
          </>
        ) : delimiter.hardBreak ? (
          <>
            Type{" "}
            <kbd className="tnum-serif inline-flex items-center px-1 py-[1px] rounded border border-[color:var(--border)] bg-[var(--surface-2)] text-[0.7rem] not-italic">
              {delimiter.glyph}
            </kbd>{" "}
            to force a new line, then Re-align.
          </>
        ) : (
          <>Edit freely, then Re-align to apply changes.</>
        )}
      </p>
    </div>
  );
}

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
