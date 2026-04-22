"use client";

import { useRef } from "react";
import { FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/studio/status-pill";
import { cn } from "@/lib/cn";

type Props = {
  onImport: (file: File) => void;
  importedTrack?: {
    fileName: string;
    cueCount: number;
    format: "srt" | "vtt" | "json";
  } | null;
  onClear?: () => void;
  disabled?: boolean;
};

const ACCEPTED = ".srt,.vtt,.json,application/json,text/vtt,text/plain";

export function SubtitleImport({
  onImport,
  importedTrack,
  onClear,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--border) 70%, transparent)",
          }}
        />
        <span className="ital-label text-[0.66rem] text-[color:var(--muted)]">
          or continue from subtitles
        </span>
        <div
          aria-hidden
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(to left, transparent, var(--border) 70%, transparent)",
          }}
        />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full justify-between rounded-xl px-3.5"
      >
        <span className="inline-flex items-center gap-2">
          <FileUp className="h-3.5 w-3.5" />
          Import subtitles
        </span>
        <span className="tnum-serif text-[0.68rem] text-[color:var(--muted)]">
          SRT · VTT · JSON
        </span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.currentTarget.value = "";
        }}
      />
      <p className="max-w-[30ch] text-[0.72rem] leading-relaxed text-[color:var(--muted)]">
        Bring in existing subtitles and keep editing here instead of
        retranscribing.
      </p>

      {importedTrack ? (
        <div
          className={cn(
            "rounded-xl px-3 py-2.5 flex items-start gap-3",
            "border border-[color:var(--border)] bg-[var(--surface-2)]/70",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusPill status="ready" label="Imported" />
            </div>
            <div className="mt-2 text-[0.8rem] font-medium text-[color:var(--fg)] truncate">
              {importedTrack.fileName}
            </div>
            <div className="mt-0.5 text-[0.7rem] text-[color:var(--muted)]">
              {importedTrack.cueCount}{" "}
              {importedTrack.format === "json" ? "captions" : "cues"}
              <span aria-hidden className="mx-1 opacity-60">
                ·
              </span>
              <span className="uppercase tracking-[0.08em]">
                {importedTrack.format}
              </span>
            </div>
          </div>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className={cn(
                "mt-0.5 h-9 w-9 shrink-0 rounded flex items-center justify-center",
                "text-[color:var(--muted)] transition-colors duration-200",
                "[@media(hover:hover)]:hover:bg-[var(--surface-3)]",
                "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
                "disabled:opacity-50 disabled:pointer-events-none",
              )}
              aria-label="Clear imported subtitles"
              title="Clear imported subtitles"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
