"use client";

import * as React from "react";
import { Download, Sparkles, RotateCcw, FileCode2, Captions } from "lucide-react";
import { toast } from "sonner";
import type { Caption } from "@remotion/captions";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { VideoDropzone } from "@/components/studio/video-dropzone";
import { ScriptInput } from "@/components/studio/script-input";
import { StyleGrid } from "@/components/studio/style-grid";
import { StyleControls } from "@/components/studio/style-controls";
import { PreviewPlayer } from "@/components/studio/preview-player";
import { StatusPill } from "@/components/studio/status-pill";
import { ApiKeyBanner } from "@/components/studio/api-key-banner";
import { ApiKeyDialog } from "@/components/studio/api-key-dialog";
import { EmptyPreview } from "@/components/studio/empty-preview";
import { LoadingPreview } from "@/components/studio/loading-preview";
import { getVideoMetaFromFile, type VideoMeta } from "@/lib/video-meta";
import { downloadSrt, downloadJson } from "@/lib/export";
import { useDeepgramKey, DEEPGRAM_KEY_HEADER } from "@/lib/api-key";
import { KeyRound } from "lucide-react";
import {
  CAPTION_STYLES,
  DEFAULT_STYLE_OPTIONS,
  type CaptionStyleId,
  type StyleOptions,
} from "@/lib/types";

const FPS = 30;

type JobStatus = "idle" | "running" | "ready" | "error";

export default function StudioPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [videoMeta, setVideoMeta] = React.useState<VideoMeta | null>(null);
  const [script, setScript] = React.useState("");
  const [captions, setCaptions] = React.useState<Caption[] | null>(null);
  const [status, setStatus] = React.useState<JobStatus>("idle");
  const [styleId, setStyleId] = React.useState<CaptionStyleId>("tiktok");
  const [styleOptions, setStyleOptions] = React.useState<StyleOptions>(
    DEFAULT_STYLE_OPTIONS,
  );
  const [deepgramKey, setDeepgramKey] = useDeepgramKey();
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);

  const videoSrc = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  // Revoke blob URLs when they change.
  React.useEffect(() => {
    if (!videoSrc) return;
    return () => URL.revokeObjectURL(videoSrc);
  }, [videoSrc]);

  // Load video metadata (width/height/duration) whenever file changes.
  React.useEffect(() => {
    if (!file) return;
    let cancelled = false;
    getVideoMetaFromFile(file)
      .then((meta) => {
        if (!cancelled) setVideoMeta(meta);
      })
      .catch((err: Error) => {
        if (!cancelled)
          toast.error("Could not read video", { description: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setVideoMeta(null);
    setCaptions(null);
    setStatus("idle");
  };

  const handleStyleChange = (id: CaptionStyleId) => {
    const meta = CAPTION_STYLES.find((s) => s.id === id)!;
    setStyleId(id);
    setStyleOptions((prev) => ({
      ...prev,
      accentColor: meta.defaultAccent,
      wordsPerPage: meta.defaultWordsPerPage,
    }));
  };

  const canGenerate = Boolean(file && videoMeta) && status !== "running";
  const hasCaptions = captions && captions.length > 0;

  const generate = React.useCallback(async () => {
    if (!file) return;
    if (!deepgramKey) {
      setKeyDialogOpen(true);
      return;
    }
    const useScript = script.trim().length > 0;
    setStatus("running");
    const form = new FormData();
    form.append("file", file);
    if (useScript) form.append("script", script);

    const endpoint = useScript ? "/api/align" : "/api/transcribe";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: form,
        headers: { [DEEPGRAM_KEY_HEADER]: deepgramKey },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Unexpected error");
      }
      setCaptions(json.captions);
      setStatus("ready");
      toast.success(
        useScript
          ? `Aligned ${json.wordCount} words to your script.`
          : `Transcribed ${json.wordCount} words.`,
      );
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Caption generation failed", { description: message });
    }
  }, [file, script, deepgramKey]);

  const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "captions";

  const handleDownloadSrt = () => {
    if (!captions) return;
    downloadSrt(captions, baseName, styleOptions.wordsPerPage);
    toast.success("Downloaded .srt");
  };

  const handleDownloadJson = () => {
    if (!captions) return;
    downloadJson(captions, baseName);
    toast.success("Downloaded .json");
  };

  const totalDurationSec = videoMeta?.durationSec ?? 5;
  const durationInFrames = Math.max(
    FPS,
    Math.round((totalDurationSec + 0.5) * FPS),
  );

  return (
    <main className="h-dvh w-dvw flex flex-col overflow-hidden">
      <Header
        fileName={file?.name ?? null}
        status={status}
        hasCaptions={Boolean(hasCaptions)}
        hasKey={Boolean(deepgramKey)}
        onOpenKeyDialog={() => setKeyDialogOpen(true)}
        onDownloadSrt={handleDownloadSrt}
        onDownloadJson={handleDownloadJson}
      />

      <ApiKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        currentKey={deepgramKey}
        onSave={(k) => {
          setDeepgramKey(k);
          if (k) toast.success("API key saved");
          else toast.message("API key removed");
        }}
      />

      <div className="flex-1 min-h-0 grid grid-cols-[320px_1fr_340px] gap-4 p-4 pt-0">
        {/* Left */}
        <aside className="panel p-4 flex flex-col gap-4 min-h-0 overflow-y-auto">
          {!deepgramKey ? (
            <ApiKeyBanner onClick={() => setKeyDialogOpen(true)} />
          ) : null}

          <div className="flex flex-col gap-2">
            <SectionLabel>Source</SectionLabel>
            <VideoDropzone
              file={file}
              onFileChange={handleFileChange}
              disabled={status === "running"}
            />
          </div>

          <ScriptInput
            script={script}
            onScriptChange={setScript}
            disabled={status === "running"}
          />

          <Button
            onClick={generate}
            disabled={!canGenerate}
            size="lg"
            className="w-full"
          >
            {status === "running" ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-black/20 border-t-black spin-slow" />
                Working…
              </>
            ) : hasCaptions ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate captions
              </>
            )}
          </Button>

          {hasCaptions ? (
            <CaptionSummary
              captions={captions!}
              mode={script.trim().length > 0 ? "Script-aligned" : "Transcribed"}
            />
          ) : null}
        </aside>

        {/* Center */}
        <section className="panel p-4 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {status === "running" ? (
              <LoadingPreview
                message={
                  script.trim().length > 0
                    ? "Aligning your script…"
                    : "Transcribing with Deepgram…"
                }
                detail="This takes a few seconds. Don't close the tab."
              />
            ) : !file || !videoMeta ? (
              <EmptyPreview />
            ) : (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ minHeight: 0 }}
              >
                <div
                  className="relative max-h-full max-w-full"
                  style={{
                    aspectRatio: `${videoMeta.width} / ${videoMeta.height}`,
                    width: "auto",
                    height: "100%",
                  }}
                >
                  <PreviewPlayer
                    durationInFrames={durationInFrames}
                    fps={FPS}
                    compositionWidth={videoMeta.width}
                    compositionHeight={videoMeta.height}
                    inputProps={{
                      videoSrc: videoSrc!,
                      captions: captions ?? [],
                      styleId,
                      styleOptions,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right */}
        <aside className="panel p-4 flex flex-col gap-5 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-3">
            <SectionLabel>Caption style</SectionLabel>
            <StyleGrid value={styleId} onChange={handleStyleChange} />
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <div className="flex flex-col gap-3">
            <SectionLabel>Look & feel</SectionLabel>
            <StyleControls value={styleOptions} onChange={setStyleOptions} />
          </div>
        </aside>
      </div>
    </main>
  );
}

const Header: React.FC<{
  fileName: string | null;
  status: JobStatus;
  hasCaptions: boolean;
  hasKey: boolean;
  onOpenKeyDialog: () => void;
  onDownloadSrt: () => void;
  onDownloadJson: () => void;
}> = ({
  fileName,
  status,
  hasCaptions,
  hasKey,
  onOpenKeyDialog,
  onDownloadSrt,
  onDownloadJson,
}) => {
  const label =
    status === "running"
      ? "Generating…"
      : status === "error"
        ? "Error"
        : status === "ready"
          ? "Ready"
          : "Idle";

  return (
    <header className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-8 w-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
          <Captions className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent-glow)]" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight">Caption Studio</div>
          <div className="text-[11px] text-[var(--color-muted)] truncate">
            {fileName ?? "Drop a video, pick a style, export."}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusPill status={status} label={label} />
        <div className="h-5 w-px bg-[var(--color-border)] mx-1" />
        <Button
          variant={hasKey ? "ghost" : "secondary"}
          size="sm"
          onClick={onOpenKeyDialog}
          title={hasKey ? "Deepgram key connected" : "Add Deepgram key"}
        >
          <KeyRound
            className="h-3.5 w-3.5"
            style={{
              color: hasKey ? "var(--color-accent)" : undefined,
            }}
          />
          {hasKey ? "Key" : "Add key"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownloadJson}
          disabled={!hasCaptions}
        >
          <FileCode2 className="h-3.5 w-3.5" /> JSON
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownloadSrt}
          disabled={!hasCaptions}
        >
          <Download className="h-3.5 w-3.5" /> SRT
        </Button>
      </div>
    </header>
  );
};

const CaptionSummary: React.FC<{
  captions: Caption[];
  mode: string;
}> = ({ captions, mode }) => {
  const totalMs = captions[captions.length - 1]?.endMs ?? 0;
  const totalSec = (totalMs / 1000).toFixed(1);
  return (
    <div className="rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3">
      <div className="flex items-center justify-between">
        <SectionLabel>Transcript</SectionLabel>
        <span className="text-[10px] text-[var(--color-accent)] uppercase tracking-wider font-semibold">
          {mode}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Words" value={captions.length.toString()} />
        <Stat label="Span" value={`${totalSec}s`} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md bg-[var(--color-surface-3)] px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
      {label}
    </div>
    <div className="text-sm font-semibold font-mono tabular-nums mt-0.5">
      {value}
    </div>
  </div>
);
