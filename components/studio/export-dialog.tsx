"use client";

import { type FC, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileCode2,
  FileText,
  Film,
  Loader2,
  X,
} from "lucide-react";
import type { Caption } from "@remotion/captions";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import {
  EXPORT_QUALITY_BITRATE,
  EXPORT_QUALITY_LABEL,
  exportCaptionedVideo,
  getSupportedExportFormats,
  type ExportFormat,
  type ExportQuality,
} from "@/lib/video-export";
import type { StyleOptions } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  captions: Caption[];
  styleOptions: StyleOptions;
  baseName: string;
  onDownloadSrt: () => void;
  onDownloadJson: () => void;
  onVideoSaved?: (filename: string) => void;
  onError?: (message: string) => void;
};

const FORMAT_LABEL: Record<ExportFormat, string> = {
  mp4: "MP4",
  webm: "WebM",
};

const FORMAT_HINT: Record<ExportFormat, string> = {
  mp4: "Universal — Instagram, TikTok, iMessage",
  webm: "Smaller file, great for the web",
};

export const ExportDialog: FC<Props> = ({
  open,
  onOpenChange,
  file,
  captions,
  styleOptions,
  baseName,
  onDownloadSrt,
  onDownloadJson,
  onVideoSaved,
  onError,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const supported = useMemo(() => getSupportedExportFormats(), []);
  const [format, setFormat] = useState<ExportFormat>(
    supported.includes("mp4") ? "mp4" : supported[0] ?? "webm",
  );
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasCaptions = captions.length > 0;
  const canExportVideo = Boolean(file) && supported.length > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      if (isExporting) abortRef.current?.abort();
      onOpenChange(false);
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onOpenChange, isExporting]);

  const handleExportVideo = async () => {
    if (!file || !canExportVideo) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsExporting(true);
    setProgress(0);
    try {
      const blob = await exportCaptionedVideo({
        file,
        captions,
        styleOptions,
        format,
        quality,
        signal: controller.signal,
        onProgress: (p) => setProgress(p),
      });
      const filename = `${baseName}.${format === "mp4" ? "mp4" : "webm"}`;
      triggerDownload(blob, filename);
      onVideoSaved?.(filename);
      setProgress(1);
      setTimeout(() => {
        onOpenChange(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        const msg =
          err instanceof Error ? err.message : "Couldn't render that video";
        onError?.(msg);
      }
    } finally {
      setIsExporting(false);
      abortRef.current = null;
    }
  };

  const handleCancelExport = () => {
    abortRef.current?.abort();
  };

  const close = () => {
    if (isExporting) return;
    onOpenChange(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 m-auto p-0 bg-transparent",
        "max-w-[520px] w-[calc(100vw-2rem)]",
        "backdrop:bg-[color-mix(in_oklab,var(--fg)_40%,transparent)]",
        "backdrop:backdrop-blur-[6px]",
        "focus:outline-none",
        "open:animate-[fade-rise_280ms_var(--ease-out-soft)]",
      )}
      aria-labelledby="export-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-pop)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5">
          <button
            type="button"
            onClick={close}
            disabled={isExporting}
            className={cn(
              "absolute top-4 right-4 h-9 w-9 rounded-md flex items-center justify-center",
              "text-[color:var(--muted)] transition-colors duration-200",
              "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
              "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
              "disabled:opacity-40 disabled:pointer-events-none",
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="relative h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-edge)",
                boxShadow: "0 6px 18px -8px var(--accent-glow)",
              }}
            >
              <Film
                className="h-4 w-4"
                style={{ color: "var(--accent-ink)" }}
              />
            </div>
            <div className="min-w-0">
              <h2
                id="export-dialog-title"
                className="display text-[1.0625rem] font-semibold tracking-tight text-[color:var(--fg)] leading-none"
              >
                Export
              </h2>
              <p className="text-[0.75rem] text-[color:var(--muted)] mt-1.5">
                <span className="ital-label">Rendered in your browser.</span>{" "}
                Nothing uploaded.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-5">
          <FieldRow label="Format" hint={FORMAT_HINT[format]}>
            <Segmented
              value={format}
              onChange={(v) => !isExporting && setFormat(v)}
              ariaLabel="Export format"
              size="sm"
              options={supported.map((f) => ({
                value: f,
                label: FORMAT_LABEL[f],
              }))}
              className="w-full"
            />
          </FieldRow>

          <FieldRow
            label="Quality"
            hint={
              <>
                <span className="tnum-serif">
                  {(EXPORT_QUALITY_BITRATE[quality] / 1_000_000).toFixed(0)}
                </span>{" "}
                Mbps video bitrate
              </>
            }
          >
            <Segmented
              value={quality}
              onChange={(v) => !isExporting && setQuality(v)}
              ariaLabel="Export quality"
              size="sm"
              options={(["high", "medium", "low"] as ExportQuality[]).map(
                (q) => ({
                  value: q,
                  label: EXPORT_QUALITY_LABEL[q],
                }),
              )}
              className="w-full"
            />
          </FieldRow>

          {isExporting ? (
            <ProgressBlock progress={progress} onCancel={handleCancelExport} />
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleExportVideo}
              disabled={!canExportVideo}
            >
              <Download className="h-4 w-4" />
              Export video
            </Button>
          )}

          {!canExportVideo && !file ? (
            <p className="text-[0.75rem] text-[color:var(--muted)] leading-relaxed -mt-2">
              Drop a video in first, then come back.
            </p>
          ) : null}
          {!canExportVideo && file ? (
            <p className="text-[0.75rem] text-[color:var(--muted)] leading-relaxed -mt-2">
              This browser can&apos;t record video. Try Chrome or Safari, or
              download the caption files below.
            </p>
          ) : null}
        </div>

        <div
          className="px-6 py-5 flex flex-col gap-3"
          style={{
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[0.6875rem] uppercase tracking-[0.14em] font-semibold text-[color:var(--muted)]">
              Caption files
            </div>
            <span className="ital-label text-[0.7rem] text-[color:var(--muted)]">
              optional
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FileRow
              icon={<FileText className="h-[13px] w-[13px]" />}
              name=".srt"
              hint="subtitles"
              onClick={onDownloadSrt}
              disabled={!hasCaptions || isExporting}
            />
            <FileRow
              icon={<FileCode2 className="h-[13px] w-[13px]" />}
              name=".json"
              hint="word-level"
              onClick={onDownloadJson}
              disabled={!hasCaptions || isExporting}
            />
          </div>
        </div>
      </div>
    </dialog>
  );
};

const FieldRow: FC<{
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between gap-3">
      <div className="text-[0.6875rem] uppercase tracking-[0.14em] font-semibold text-[color:var(--muted)]">
        {label}
      </div>
      {hint ? (
        <div className="text-[0.7rem] text-[color:var(--muted)] leading-none">
          {hint}
        </div>
      ) : null}
    </div>
    {children}
  </div>
);

const ProgressBlock: FC<{ progress: number; onCancel: () => void }> = ({
  progress,
  onCancel,
}) => {
  const pct = Math.round(progress * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[0.8125rem] text-[color:var(--fg)]">
          <Loader2 className="h-3.5 w-3.5 spin-slow text-[color:var(--accent-ink)]" />
          <span>Rendering</span>
          <span className="tnum-serif text-[0.9375rem] text-[color:var(--fg)]">
            {pct}%
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div
        className="relative h-1.5 w-full rounded-full overflow-hidden"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-out"
          style={{
            width: `${pct}%`,
            background: "var(--accent)",
            boxShadow: "0 0 14px -3px var(--accent-glow)",
          }}
        />
      </div>
      <p className="ital-label text-[0.7rem] text-[color:var(--muted)] leading-relaxed">
        Recording plays the video once — roughly the video&apos;s length.
      </p>
    </div>
  );
};

const FileRow: FC<{
  icon: React.ReactNode;
  name: string;
  hint: string;
  onClick: () => void;
  disabled: boolean;
}> = ({ icon, name, hint, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "group flex items-center justify-between gap-3 h-11 px-3.5 rounded-lg",
      "bg-[var(--surface-1)] border border-[color:var(--border)]",
      "text-[color:var(--fg)] shadow-[var(--shadow-soft)]",
      "transition-[transform,background,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
      "[@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
      "[@media(hover:hover)]:hover:-translate-y-[1px]",
      "disabled:opacity-45 disabled:pointer-events-none disabled:shadow-none",
    )}
  >
    <span className="flex items-center gap-2.5 min-w-0">
      <span
        className="flex items-center justify-center h-7 w-7 rounded-md text-[color:var(--muted)]"
        style={{ background: "var(--surface-2)" }}
      >
        {icon}
      </span>
      <span className="flex flex-col items-start gap-0.5 min-w-0">
        <span className="tnum-serif text-[0.8125rem] leading-none text-[color:var(--fg)]">
          {name}
        </span>
        <span className="ital-label text-[0.65rem] text-[color:var(--muted)] leading-none">
          {hint}
        </span>
      </span>
    </span>
    <Download
      className={cn(
        "h-[13px] w-[13px] text-[color:var(--muted)]",
        "transition-[transform,color] duration-200",
        "group-hover:text-[color:var(--fg)] group-hover:translate-y-[1px]",
      )}
    />
  </button>
);

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}
