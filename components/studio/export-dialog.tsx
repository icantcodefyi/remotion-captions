"use client";

import {
  type FC,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  type ExportProgress,
  type ExportQuality,
} from "@/lib/video-export";
import type { CaptionStyleId, StyleOptions } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  videoDimensions: { width: number; height: number } | null;
  videoDurationSec: number;
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
  mp4: "Fastest local export, universal compatibility",
  webm: "Smaller file, but slower to encode than MP4",
};

const DEFAULT_FORMATS: ExportFormat[] = ["mp4", "webm"];
let cachedSupportedFormats: ExportFormat[] = DEFAULT_FORMATS;
let supportedFormatsResolved = false;

const subscribeFormats = (onStoreChange: () => void) => {
  if (typeof window !== "undefined" && !supportedFormatsResolved) {
    supportedFormatsResolved = true;
    const next = getSupportedExportFormats();
    if (!sameFormats(cachedSupportedFormats, next)) {
      cachedSupportedFormats = next;
      onStoreChange();
    }
  }
  return () => undefined;
};

const getSupportedFormatsSnapshot = () => cachedSupportedFormats;
const getSupportedFormatsServerSnapshot = () => DEFAULT_FORMATS;

function useSupportedFormats() {
  return useSyncExternalStore(
    subscribeFormats,
    getSupportedFormatsSnapshot,
    getSupportedFormatsServerSnapshot,
  );
}

function sameFormats(a: ExportFormat[], b: ExportFormat[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export const ExportDialog: FC<Props> = ({
  open,
  onOpenChange,
  file,
  captions,
  styleId,
  styleOptions,
  videoDimensions,
  videoDurationSec,
  baseName,
  onDownloadSrt,
  onDownloadJson,
  onVideoSaved,
  onError,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const supported = useSupportedFormats();
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null,
  );

  const hasCaptions = captions.length > 0;
  const canExportVideo =
    Boolean(file) &&
    supported.length > 0 &&
    Boolean(videoDimensions) &&
    videoDurationSec > 0;
  const selectedFormat = supported.includes(format)
    ? format
    : supported.includes("mp4")
      ? "mp4"
      : supported[0] ?? "webm";

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
      setExportProgress(null);
      onOpenChange(false);
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onOpenChange, isExporting]);

  const handleExportVideo = async () => {
    if (!file || !canExportVideo || !videoDimensions) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsExporting(true);
    setExportProgress({
      phase: "preparing",
      progress: 0.02,
      label: "Preparing export…",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: Math.max(1, Math.round(videoDurationSec * 30)),
    });
    try {
      const blob = await exportCaptionedVideo({
        file,
        captions,
        styleId,
        styleOptions,
        format: selectedFormat,
        quality,
        width: videoDimensions.width,
        height: videoDimensions.height,
        durationSec: videoDurationSec,
        signal: controller.signal,
        onProgress: setExportProgress,
      });
      const filename = `${baseName}.${selectedFormat === "mp4" ? "mp4" : "webm"}`;
      triggerDownload(blob, filename);
      onVideoSaved?.(filename);
      setTimeout(() => {
        onOpenChange(false);
      }, 400);
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
                <span className="ital-label">Rendered on the server.</span>{" "}
                Pixel-perfect with your preview.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-5">
          <FieldRow label="Format" hint={FORMAT_HINT[selectedFormat]}>
            <Segmented
              value={selectedFormat}
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
            hint={getQualityHint(quality)}
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
            <RenderingBlock
              onCancel={handleCancelExport}
              progress={exportProgress}
            />
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
              Still reading the video. Give it a second.
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

const RenderingBlock: FC<{
  onCancel: () => void;
  progress: ExportProgress | null;
}> = ({ onCancel, progress }) => {
  const percent = Math.round((progress?.progress ?? 0) * 100);
  const barWidth = `${Math.max(percent, 4)}%`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[0.8125rem] text-[color:var(--fg)]">
          <Loader2 className="h-3.5 w-3.5 spin-slow text-[color:var(--accent-ink)]" />
          <span>{progress?.label ?? "Rendering on server…"}</span>
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
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: barWidth,
            background: "var(--accent)",
            boxShadow: "0 0 14px -3px var(--accent-glow)",
          }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-3 text-[0.7rem] text-[color:var(--muted)] leading-relaxed">
        <p className="ital-label">
          {progress?.phase === "muxing"
            ? "Final encode pass in progress."
            : "Uploading and rendering with live progress."}
        </p>
        <span className="tnum-serif">{percent}%</span>
      </div>
      <p className="text-[0.72rem] text-[color:var(--muted)] leading-relaxed">
        {getProgressDetails(progress)}
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

function getQualityHint(quality: ExportQuality) {
  const bitrate = (
    EXPORT_QUALITY_BITRATE[quality] / 1_000_000
  ).toFixed(0);

  if (quality === "low") {
    return (
      <>
        <span className="tnum-serif">{bitrate}</span> Mbps · 75% resolution for
        faster exports
      </>
    );
  }

  return (
    <>
      <span className="tnum-serif">{bitrate}</span> Mbps video bitrate
    </>
  );
}

function getProgressDetails(progress: ExportProgress | null) {
  if (!progress) {
    return "Preparing export…";
  }

  if (progress.totalFrames <= 0) {
    return progress.label;
  }

  if (progress.phase === "rendering") {
    return `${Math.min(progress.renderedFrames, progress.totalFrames)} of ${progress.totalFrames} frames rendered`;
  }

  if (progress.phase === "muxing") {
    return `${Math.min(progress.encodedFrames, progress.totalFrames)} of ${progress.totalFrames} frames encoded`;
  }

  if (progress.phase === "done") {
    return "Export ready";
  }

  return progress.label;
}
