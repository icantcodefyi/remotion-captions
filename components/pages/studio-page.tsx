"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, Languages, RotateCcw, Share, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Caption } from "@remotion/captions";
import type { PlayerRef } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";
import { VideoDropzone } from "@/components/studio/video-dropzone";
import { SubtitleImport } from "@/components/studio/subtitle-import";
import { ScriptInput } from "@/components/studio/script-input";
import { StyleGrid } from "@/components/studio/style-grid";
import { StyleControls } from "@/components/studio/style-controls";
import { PreviewPlayer } from "@/components/studio/preview-player";
import { CaptionPositionOverlay } from "@/components/studio/position-overlay";
import { ApiKeyBanner } from "@/components/studio/api-key-banner";
import { ApiKeyDialog } from "@/components/studio/api-key-dialog";
import { EmptyPreview } from "@/components/studio/empty-preview";
import { LoadingPreview } from "@/components/studio/loading-preview";
import { TranscriptEditor } from "@/components/studio/transcript-editor";
import { ExportDialog } from "@/components/studio/export-dialog";
import { AspectControls } from "@/components/studio/aspect-controls";
import { BrandKits, makeSignature } from "@/components/studio/brand-kits";
import { TranslateDialog } from "@/components/studio/translate-dialog";
import { SafeZoneOverlay } from "@/components/studio/safe-zone-overlay";
import { getVideoMetaFromFile, type VideoMeta } from "@/lib/video-meta";
import { downloadSrt, downloadJson } from "@/lib/export";
import { useDeepgramKey, DEEPGRAM_KEY_HEADER } from "@/lib/api-key";
import { useOpenAIKey } from "@/lib/llm-key";
import { useBrandKits, newKitId } from "@/lib/brand-kits";
import {
  DELIMITERS,
  deriveBreaks,
  joinCaptions,
  stripForAlignment,
  useDelimiter,
} from "@/lib/delimiter";
import { importSubtitleTrack } from "@/lib/subtitle-import";
import {
  CAPTION_STYLES,
  DEFAULT_STYLE_OPTIONS,
  type AspectPresetId,
  type BrandKit,
  type CaptionStyleId,
  type StyleOptions,
} from "@/lib/types";
import { getLanguage, type LanguageCode } from "@/lib/translate";
import { getAspectPreset, reflowPosition, resolveCanvas } from "@/lib/aspect";
import { getBlogHref } from "@/lib/site";

const FPS = 30;

type JobStatus = "idle" | "running" | "ready" | "error";
type RightTab = "style" | "edit";
type GenerationMode = "align" | "transcribe" | "import";
type ImportedTrackMeta = {
  fileName: string;
  cueCount: number;
  format: "srt" | "vtt" | "json";
};

export function StudioPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [videoMeta, setVideoMeta] = React.useState<VideoMeta | null>(null);
  const [script, setScript] = React.useState("");
  const [captions, setCaptions] = React.useState<Caption[] | null>(null);
  const [breaks, setBreaks] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<JobStatus>("idle");
  const [generationMode, setGenerationMode] =
    React.useState<GenerationMode>("transcribe");
  const [importedTrack, setImportedTrack] =
    React.useState<ImportedTrackMeta | null>(null);
  const [styleId, setStyleId] = React.useState<CaptionStyleId>("tiktok");
  const [styleOptions, setStyleOptions] = React.useState<StyleOptions>(
    DEFAULT_STYLE_OPTIONS,
  );
  const [delimiter, setDelimiterId] = useDelimiter();
  const [deepgramKey, setDeepgramKey] = useDeepgramKey();
  const [openaiKey, setOpenaiKey] = useOpenAIKey();
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [translateDialogOpen, setTranslateDialogOpen] = React.useState(false);
  const [aspectId, setAspectId] = React.useState<AspectPresetId>("source");
  const [rightTab, setRightTab] = React.useState<RightTab>("style");
  const { kits, save: saveKit, remove: removeKit } = useBrandKits();
  const playerRef = React.useRef<PlayerRef>(null);

  const clearCaptions = React.useCallback(() => {
    setCaptions(null);
    setBreaks([]);
    setScript("");
    setStatus("idle");
    setGenerationMode("transcribe");
    setImportedTrack(null);
    setRightTab("style");
  }, []);

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

  // Rejoin the transcript when the delimiter changes, but only if the current
  // script is still the canonical form of the previous delimiter (i.e. the user
  // hasn't started editing). Preserves edits across delimiter switches.
  const prevDelimiterRef = React.useRef(delimiter);
  React.useEffect(() => {
    const prev = prevDelimiterRef.current;
    prevDelimiterRef.current = delimiter;
    if (prev.id === delimiter.id) return;
    if (!captions || captions.length === 0) return;
    const prevCanonical = joinCaptions(captions, prev, breaks);
    if (script === prevCanonical) {
      setScript(joinCaptions(captions, delimiter, breaks));
    }
  }, [delimiter, captions, breaks, script]);

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setVideoMeta(null);
    if (!next) {
      clearCaptions();
      return;
    }
    setStatus(captions && captions.length > 0 ? "ready" : "idle");
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

  const handleAspectChange = React.useCallback(
    (next: AspectPresetId) => {
      if (next === aspectId) return;
      setAspectId(next);
      if (!videoMeta) return;
      const preset = getAspectPreset(next);
      setStyleOptions((prev) => ({
        ...prev,
        position: reflowPosition(prev.position, videoMeta, preset),
      }));
    },
    [aspectId, videoMeta],
  );

  const handleApplyKit = React.useCallback(
    (kit: BrandKit) => {
      const aspectChanged = kit.aspectId !== aspectId;
      const nextPosition =
        aspectChanged && videoMeta
          ? reflowPosition(
              kit.styleOptions.position,
              videoMeta,
              getAspectPreset(kit.aspectId),
            )
          : kit.styleOptions.position;
      setStyleId(kit.styleId);
      setStyleOptions({ ...kit.styleOptions, position: nextPosition });
      if (aspectChanged) setAspectId(kit.aspectId);
      toast.success("Applied kit", { description: kit.name });
    },
    [aspectId, videoMeta],
  );

  const handleSaveKit = React.useCallback(
    (name: string) => {
      const kit: BrandKit = {
        id: newKitId(),
        name,
        createdAt: Date.now(),
        styleId,
        styleOptions,
        aspectId,
      };
      saveKit(kit);
      toast.success("Saved kit", { description: name });
    },
    [styleId, styleOptions, aspectId, saveKit],
  );

  const handleTranslated = React.useCallback(
    (nextCaptions: Caption[], language: LanguageCode) => {
      setCaptions(nextCaptions);
      setBreaks([]);
      setScript(joinCaptions(nextCaptions, delimiter, []));
      setStatus("ready");
      setImportedTrack(null);
      const lang = getLanguage(language);
      toast.success(`Translated to ${lang.name}`, {
        description: `${nextCaptions.length} words · timing preserved`,
      });
    },
    [delimiter],
  );

  const canGenerate = Boolean(file && videoMeta) && status !== "running";
  const hasCaptions = Boolean(captions && captions.length > 0);

  const canvas = React.useMemo(() => {
    const source = videoMeta
      ? { width: videoMeta.width, height: videoMeta.height }
      : { width: 1080, height: 1920 };
    return resolveCanvas(aspectId, source);
  }, [aspectId, videoMeta]);

  const activeKitSignature = React.useMemo(
    () => makeSignature({ styleId, styleOptions, aspectId }),
    [styleId, styleOptions, aspectId],
  );

  const runAlignment = React.useCallback(
    async ({
      useScript,
      reAlign,
    }: {
      useScript: boolean;
      reAlign: boolean;
    }) => {
      if (!file) return;
      if (!deepgramKey) {
        setKeyDialogOpen(true);
        return;
      }
      const trimmed = script.trim();
      const endpoint = useScript ? "/api/align" : "/api/transcribe";
      setStatus("running");

      const form = new FormData();
      form.append("file", file);
      if (useScript) {
        form.append("script", stripForAlignment(trimmed, delimiter));
      }

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
        const next: Caption[] = json.captions;
        const nextBreaks =
          useScript && delimiter.hardBreak
            ? deriveBreaks(trimmed, delimiter)
            : [];
        setCaptions(next);
        setGenerationMode(useScript ? "align" : "transcribe");
        setImportedTrack(null);
        setScript(joinCaptions(next, delimiter, nextBreaks));
        setBreaks(nextBreaks);
        setStatus("ready");
        const count: number = json.wordCount ?? next.length;
        toast.success(
          reAlign
            ? `Re-aligned ${count} words`
            : useScript
              ? `Aligned ${count} words to your script`
              : `Captions generated`,
        );
      } catch (err) {
        setStatus("error");
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        toast.error(
          reAlign ? "Couldn't re-align" : "Couldn't generate captions",
          { description: message },
        );
      }
    },
    [file, script, deepgramKey, delimiter],
  );

  const generate = React.useCallback(() => {
    const useScript = script.trim().length > 0;
    void runAlignment({ useScript, reAlign: false });
  }, [runAlignment, script]);

  const reAlign = React.useCallback(() => {
    if (script.trim().length === 0) return;
    void runAlignment({ useScript: true, reAlign: true });
  }, [runAlignment, script]);

  const handleImportSubtitles = React.useCallback(
    async (subtitleFile: File) => {
      try {
        const input = await subtitleFile.text();
        const imported = importSubtitleTrack(input, subtitleFile.name);
        const nextDelimiter =
          imported.breaks.length > 0 ? DELIMITERS.newline : delimiter;

        if (imported.breaks.length > 0 && delimiter.id !== "newline") {
          setDelimiterId("newline");
        }

        setCaptions(imported.captions);
        setBreaks(imported.breaks);
        setGenerationMode("import");
        setImportedTrack({
          fileName: subtitleFile.name,
          cueCount: imported.cueCount,
          format: imported.format,
        });
        setScript(
          joinCaptions(imported.captions, nextDelimiter, imported.breaks),
        );
        setStatus("ready");
        setRightTab("edit");

        const unit = imported.format === "json" ? "captions" : "subtitle cues";
        toast.success("Imported subtitles", {
          description: `${imported.cueCount} ${unit} from ${subtitleFile.name}`,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        toast.error("Couldn't import subtitles", { description: message });
      }
    },
    [delimiter, setDelimiterId],
  );

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
        canExport={Boolean(file)}
        hasKey={Boolean(deepgramKey)}
        onOpenKeyDialog={() => setKeyDialogOpen(true)}
        onOpenExportDialog={() => setExportDialogOpen(true)}
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

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        file={file}
        captions={captions ?? []}
        styleId={styleId}
        styleOptions={styleOptions}
        videoDimensions={videoMeta ? canvas : null}
        videoDurationSec={videoMeta?.durationSec ?? 0}
        baseName={baseName}
        onDownloadSrt={handleDownloadSrt}
        onDownloadJson={handleDownloadJson}
        onVideoSaved={(filename) =>
          toast.success("Saved", { description: filename })
        }
        onError={(message) =>
          toast.error("Couldn't export", { description: message })
        }
      />

      <TranslateDialog
        open={translateDialogOpen}
        onOpenChange={setTranslateDialogOpen}
        captions={captions}
        wordsPerPage={styleOptions.wordsPerPage}
        openaiKey={openaiKey}
        onOpenaiKeyChange={setOpenaiKey}
        onTranslated={handleTranslated}
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
          "lg:[grid-template-columns:340px_minmax(0,1fr)_340px]",
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
            {!hasCaptions ? (
              <SubtitleImport
                onImport={handleImportSubtitles}
                importedTrack={importedTrack}
                onClear={clearCaptions}
                disabled={status === "running"}
              />
            ) : null}
          </div>

          <Divider />

          <ScriptInput
            script={script}
            onScriptChange={setScript}
            captions={captions}
            breaks={breaks}
            delimiter={delimiter}
            onDelimiterChange={setDelimiterId}
            onReAlign={reAlign}
            isAligning={status === "running" && hasCaptions}
            generationMode={generationMode}
            hasSourceMedia={Boolean(file)}
            disabled={status === "running"}
          />

          {!hasCaptions ? (
            <Button
              onClick={generate}
              disabled={!canGenerate}
              size="lg"
              className={cn(
                "w-full mt-1 shrink-0",
                canGenerate && "accent-pulse",
              )}
            >
              {status === "running" ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-[color:var(--accent-deep)]/20 border-t-[color:var(--accent-deep)] spin-slow" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate captions
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Button
                onClick={() => setTranslateDialogOpen(true)}
                disabled={status === "running"}
                variant="secondary"
                size="sm"
                className="w-full"
                title="Translate captions while keeping timing intact"
              >
                <Languages className="h-3.5 w-3.5" />
                Translate…
              </Button>
              <Button
                onClick={clearCaptions}
                disabled={status === "running"}
                variant="ghost"
                size="sm"
                className="w-full"
                title="Clear the current caption pass and start over"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start over
              </Button>
            </div>
          )}
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
              <EmptyPreview
                mode={hasCaptions && generationMode === "import" ? "needs-source" : "empty"}
              />
            ) : (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ minHeight: 0 }}
              >
                <div
                  className="relative max-h-full max-w-full"
                  style={{
                    aspectRatio: `${canvas.width} / ${canvas.height}`,
                    width: "auto",
                    height: "100%",
                  }}
                >
                  <PreviewPlayer
                    ref={playerRef}
                    durationInFrames={durationInFrames}
                    fps={FPS}
                    compositionWidth={canvas.width}
                    compositionHeight={canvas.height}
                    inputProps={{
                      videoSrc: videoSrc!,
                      captions: captions ?? [],
                      styleId,
                      styleOptions,
                    }}
                  />
                  <SafeZoneOverlay aspectId={aspectId} />
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
            <div className="flex flex-col gap-6 min-h-0 overflow-y-auto -mx-1 px-1">
              <AspectControls
                value={aspectId}
                onChange={handleAspectChange}
                sourceDimensions={
                  videoMeta
                    ? { width: videoMeta.width, height: videoMeta.height }
                    : null
                }
              />
              <Divider />
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
              <Divider />
              <BrandKits
                kits={kits}
                activeSignature={activeKitSignature}
                onApply={handleApplyKit}
                onSave={handleSaveKit}
                onDelete={removeKit}
              />
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
              forcedBreaks={breaks.length > 0 ? breaks : null}
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
  canExport: boolean;
  hasKey: boolean;
  onOpenKeyDialog: () => void;
  onOpenExportDialog: () => void;
}> = ({ canExport, hasKey, onOpenKeyDialog, onOpenExportDialog }) => {
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

      <div className="flex items-center gap-0.5">
        <Link
          href={getBlogHref("/blog", "guides_header")}
          className="hidden sm:inline-flex items-center justify-center rounded-md h-8 px-3 text-[0.75rem] font-medium bg-transparent text-[color:var(--fg-weak)] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:hover:bg-[var(--surface-2)] [@media(hover:hover)]:hover:text-[color:var(--fg)]"
        >
          Guides
        </Link>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenKeyDialog}
          title={hasKey ? "API key connected" : "Add API key"}
          aria-label={hasKey ? "API key connected" : "Add API key"}
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
        <span
          aria-hidden
          className="hidden sm:block mx-2 h-5 w-px bg-[color:var(--border)]"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenExportDialog}
          disabled={!canExport}
          className="ml-0.5"
        >
          <Share className="h-[13px] w-[13px]" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </header>
  );
};
