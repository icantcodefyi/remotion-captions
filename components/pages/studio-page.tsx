"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  FileCode2,
  KeyRound,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Caption } from "@remotion/captions";
import type { PlayerRef } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";
import { VideoDropzone } from "@/components/studio/video-dropzone";
import { ScriptInput } from "@/components/studio/script-input";
import { StyleGrid } from "@/components/studio/style-grid";
import { StyleControls } from "@/components/studio/style-controls";
import { PreviewPlayer } from "@/components/studio/preview-player";
import { CaptionPositionOverlay } from "@/components/studio/position-overlay";
import { CaptionInlineEditor } from "@/components/studio/caption-inline-editor";
import { ApiKeyBanner } from "@/components/studio/api-key-banner";
import { ApiKeyDialog } from "@/components/studio/api-key-dialog";
import { EmptyPreview } from "@/components/studio/empty-preview";
import { LoadingPreview } from "@/components/studio/loading-preview";
import { TranscriptEditor } from "@/components/studio/transcript-editor";
import { getVideoMetaFromFile, type VideoMeta } from "@/lib/video-meta";
import { downloadSrt, downloadJson } from "@/lib/export";
import { useDeepgramKey, DEEPGRAM_KEY_HEADER } from "@/lib/api-key";
import {
  CAPTION_STYLES,
  DEFAULT_STYLE_OPTIONS,
  type CaptionStyleId,
  type StyleOptions,
} from "@/lib/types";
import { getBlogHref } from "@/lib/site";

const FPS = 30;

type JobStatus = "idle" | "running" | "ready" | "error";
type RightTab = "style" | "edit";

export function StudioPage() {
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
  const [rightTab, setRightTab] = React.useState<RightTab>("style");
  const [editingPageIndex, setEditingPageIndex] = React.useState<number | null>(
    null,
  );
  const playerRef = React.useRef<PlayerRef>(null);

  const videoSrc = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  React.useEffect(() => {
    if (!videoSrc) return;
    return () => URL.revokeObjectURL(videoSrc);
  }, [videoSrc]);

  React.useEffect(() => {
    if (!file) return;
    let cancelled = false;
    getVideoMetaFromFile(file)
      .then((meta) => {
        if (!cancelled) setVideoMeta(meta);
      })
      .catch((err: Error) => {
        if (!cancelled)
          toast.error("Couldn't read that file", {
            description: err.message,
          });
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
  const hasCaptions = Boolean(captions && captions.length > 0);

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
          ? `Aligned ${json.wordCount} words to your script`
          : `Captions generated`,
      );
    } catch (err) {
      setStatus("error");
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Couldn't generate captions", { description: message });
    }
  }, [file, script, deepgramKey]);

  const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "captions";

  const handleDownloadSrt = () => {
    if (!captions) return;
    downloadSrt(captions, baseName, styleOptions.wordsPerPage);
    toast.success("Saved .srt");
  };

  const handleDownloadJson = () => {
    if (!captions) return;
    downloadJson(captions, baseName);
    toast.success("Saved .json");
  };

  const totalDurationSec = videoMeta?.durationSec ?? 5;
  const durationInFrames = Math.max(
    FPS,
    Math.round((totalDurationSec + 0.5) * FPS),
  );

  return (
    <main className="h-dvh w-dvw flex flex-col overflow-hidden">
      <Header
        hasCaptions={hasCaptions}
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
          if (k) toast.success("Key saved");
          else toast.message("Key removed");
        }}
      />

      <div
        className={cn(
          "flex-1 min-h-0 grid gap-4 px-4 pb-4 pt-0",
          "[grid-template-columns:1fr]",
          "[grid-template-rows:auto_minmax(0,1fr)_auto]",
          "[grid-template-areas:'source''preview''style']",
          "md:[grid-template-columns:320px_minmax(0,1fr)]",
          "md:[grid-template-rows:auto_minmax(0,1fr)]",
          "md:[grid-template-areas:'source_preview''style_preview']",
          "md:gap-5 md:px-5 md:pb-5",
          "lg:[grid-template-columns:320px_minmax(0,1fr)_340px]",
          "lg:[grid-template-rows:minmax(0,1fr)]",
          "lg:[grid-template-areas:'source_preview_style']",
        )}
      >
        <aside
          className="panel p-5 flex flex-col gap-5 min-h-0 overflow-y-auto fade-rise [grid-area:source]"
          style={{ ["--i" as string]: 1 }}
        >
          {!deepgramKey ? (
            <ApiKeyBanner onClick={() => setKeyDialogOpen(true)} />
          ) : null}

          <div className="flex flex-col gap-2.5">
            <SectionLabel>Source</SectionLabel>
            <VideoDropzone
              file={file}
              onFileChange={handleFileChange}
              disabled={status === "running"}
            />
          </div>

          <Divider />

          <ScriptInput
            script={script}
            onScriptChange={setScript}
            disabled={status === "running"}
          />

          <Button
            onClick={generate}
            disabled={!canGenerate}
            size="lg"
            className={cn(
              "w-full mt-1",
              canGenerate && !hasCaptions && "accent-pulse",
            )}
          >
            {status === "running" ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-[color:var(--accent-deep)]/20 border-t-[color:var(--accent-deep)] spin-slow" />
                Generating…
              </>
            ) : hasCaptions ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Run again
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
              mode={script.trim().length > 0 ? "Aligned" : "Transcribed"}
            />
          ) : null}
        </aside>

        <section
          className="panel p-5 flex flex-col min-h-0 fade-rise [grid-area:preview]"
          style={{ ["--i" as string]: 2 }}
        >
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {status === "running" ? (
              <LoadingPreview
                mode={script.trim().length > 0 ? "align" : "transcribe"}
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
                    ref={playerRef}
                    durationInFrames={durationInFrames}
                    fps={FPS}
                    compositionWidth={videoMeta.width}
                    compositionHeight={videoMeta.height}
                    inputProps={{
                      videoSrc: videoSrc!,
                      captions: captions ?? [],
                      styleId,
                      styleOptions,
                      hiddenPageIndex: editingPageIndex,
                    }}
                  />
                  {hasCaptions ? (
                    <CaptionInlineEditor
                      captions={captions!}
                      onCaptionsChange={setCaptions}
                      playerRef={playerRef}
                      fps={FPS}
                      position={styleOptions.position}
                      wordsPerPage={styleOptions.wordsPerPage}
                      styleId={styleId}
                      styleOptions={styleOptions}
                      compositionWidth={videoMeta.width}
                      onEditingPageChange={setEditingPageIndex}
                    />
                  ) : null}
                  <CaptionPositionOverlay
                    position={styleOptions.position}
                    onChange={(position) =>
                      setStyleOptions((prev) => ({ ...prev, position }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <aside
          className="panel p-5 flex flex-col gap-4 min-h-0 fade-rise [grid-area:style]"
          style={{ ["--i" as string]: 3 }}
        >
          <Segmented
            value={rightTab}
            onChange={(v) => {
              if (v === "edit" && !hasCaptions) {
                toast.message("Add a video first");
                return;
              }
              setRightTab(v);
            }}
            ariaLabel="Right panel mode"
            size="sm"
            options={[
              { value: "style", label: "Style" },
              {
                value: "edit",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    Edit
                    {hasCaptions ? (
                      <span className="tnum-serif italic text-[0.65rem] opacity-70">
                        {captions!.length}
                      </span>
                    ) : null}
                  </span>
                ),
              },
            ]}
            className="w-full"
          />

          {rightTab === "style" ? (
            <div className="flex flex-col gap-6 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-3">
                <SectionLabel>Caption style</SectionLabel>
                <StyleGrid value={styleId} onChange={handleStyleChange} />
              </div>
              <Divider />
              <div className="flex flex-col gap-5">
                <StyleControls
                  value={styleOptions}
                  onChange={setStyleOptions}
                />
              </div>
            </div>
          ) : (
            <TranscriptEditor
              captions={captions ?? []}
              onCaptionsChange={setCaptions}
              file={file}
              playerRef={playerRef}
              durationMs={totalDurationSec * 1000}
              fps={FPS}
              wordsPerPage={styleOptions.wordsPerPage}
            />
          )}
        </aside>
      </div>

      <footer
        className="hidden lg:flex items-center justify-between px-5 pb-3 pt-0 text-[0.7rem] text-[color:var(--muted)] fade-rise"
        style={{ ["--i" as string]: 4 }}
      >
        <div className="ital-label">
          Captions rendered with Remotion · transcription by Deepgram
        </div>
        <div className="flex items-center gap-2">
          <kbd className="inline-flex items-center px-1.5 py-[1px] rounded border border-[color:var(--border)] bg-[var(--surface-2)] tnum-serif text-[0.7rem]">
            ⌘
          </kbd>
          <kbd className="inline-flex items-center px-1.5 py-[1px] rounded border border-[color:var(--border)] bg-[var(--surface-2)] tnum-serif text-[0.7rem]">
            Enter
          </kbd>
          <span className="ital-label">to generate</span>
        </div>
      </footer>
    </main>
  );
}

const Divider: React.FC = () => (
  <div
    aria-hidden
    className="h-px w-full"
    style={{
      background:
        "linear-gradient(to right, transparent, var(--border) 15%, var(--border) 85%, transparent)",
    }}
  />
);

const Header: React.FC<{
  hasCaptions: boolean;
  hasKey: boolean;
  onOpenKeyDialog: () => void;
  onDownloadSrt: () => void;
  onDownloadJson: () => void;
}> = ({
  hasCaptions,
  hasKey,
  onOpenKeyDialog,
  onDownloadSrt,
  onDownloadJson,
}) => {
  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-5 py-4 fade-rise">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="relative h-10 w-10 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <Image
            src="/meowcap-logo.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 object-contain logo-invert"
          />
        </div>
        <div className="min-w-0">
          <div className="display text-[1.0625rem] font-semibold tracking-[-0.02em] text-[color:var(--fg)] leading-none">
            MeowCap
          </div>
          <div className="ital-label text-[0.75rem] text-[color:var(--muted)] mt-1">
            captions that purr
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={getBlogHref("/blog", "guides_header")}
          className="hidden sm:inline-flex items-center justify-center gap-2 rounded-md h-8 px-3 text-[0.75rem] font-medium bg-[var(--surface-1)] text-[color:var(--fg)] border border-[color:var(--border)] shadow-[var(--shadow-soft)] hover:bg-[var(--surface-2)] hover:border-[color:var(--border-strong)] transition-[transform,background,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px]"
        >
          Guides
        </Link>
        <ThemeToggle />
        <Button
          variant={hasKey ? "ghost" : "secondary"}
          size="sm"
          onClick={onOpenKeyDialog}
          title={hasKey ? "API key connected" : "Add API key"}
        >
          <KeyRound
            className="h-[13px] w-[13px]"
            style={{
              color: hasKey ? "var(--accent-ink)" : undefined,
            }}
          />
          <span className="hidden sm:inline">
            {hasKey ? "Key" : "Add key"}
          </span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownloadJson}
          disabled={!hasCaptions}
        >
          <FileCode2 className="h-[13px] w-[13px]" />
          <span className="hidden sm:inline">JSON</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownloadSrt}
          disabled={!hasCaptions}
        >
          <Download className="h-[13px] w-[13px]" />
          <span className="hidden sm:inline">SRT</span>
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
    <div
      className="rounded-xl p-3 fade-rise"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <SectionLabel>Transcript</SectionLabel>
        <span
          className="text-[0.625rem] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full"
          style={{
            color: "var(--accent-ink)",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-edge)",
          }}
        >
          {mode}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Stat label="Words" value={captions.length.toString()} />
        <Stat label="Span" value={`${totalSec}s`} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="rounded-md px-3 py-2"
    style={{
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
    }}
  >
    <div className="ital-label text-[0.7rem] normal-case tracking-normal text-[color:var(--muted)]">
      {label}
    </div>
    <div className="tnum-serif text-[1.0625rem] mt-0.5 text-[color:var(--fg)]">
      {value}
    </div>
  </div>
);
