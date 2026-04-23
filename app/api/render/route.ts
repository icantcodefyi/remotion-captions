import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { availableParallelism, platform, tmpdir } from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type {
  Codec,
  RenderMediaOnProgress,
} from "@remotion/renderer";
import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { getServeUrl } from "@/lib/remotion-bundle";
import type {
  ExportProgress,
  ExportQuality,
  ExportRenderPhase,
} from "@/lib/video-export";
import type { RenderInputProps } from "@/remotion/Root";
import type { Caption } from "@remotion/captions";
import type {
  CaptionAssistOptions,
  CaptionStyleId,
  StyleOptions,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

type RenderBody = {
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  assistOptions: CaptionAssistOptions;
  forcedBreaks?: number[] | null;
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
  format: "mp4" | "webm";
};

type RenderJobState =
  | "queued"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

type RenderJob = {
  id: string;
  state: RenderJobState;
  progress: ExportProgress;
  createdAt: number;
  outputPath: string | null;
  contentType: string | null;
  jobDir: string;
  error: string | null;
  cancel: (() => void) | null;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
};

const CODEC_BY_FORMAT: Record<RenderBody["format"], Codec> = {
  mp4: "h264",
  webm: "vp8",
};

const BITRATE_BY_QUALITY: Record<ExportQuality, string> = {
  high: "8M",
  medium: "4M",
  low: "2M",
};

const SCALE_BY_QUALITY: Record<ExportQuality, number> = {
  high: 1,
  medium: 1,
  low: 0.75,
};

const H264_PRESET_BY_QUALITY: Record<
  ExportQuality,
  "medium" | "fast" | "veryfast"
> = {
  high: "medium",
  medium: "fast",
  low: "veryfast",
};

const JOB_RETENTION_MS = 5 * 60 * 1000;
const JOB_ID_PATTERN = /^[0-9a-f-]{36}$/i;

const globalForRenderJobs = globalThis as typeof globalThis & {
  __captionRenderJobs?: Map<string, RenderJob>;
};

const renderJobs =
  globalForRenderJobs.__captionRenderJobs ??
  (globalForRenderJobs.__captionRenderJobs = new Map<string, RenderJob>());

type PersistedJobState = {
  id: string;
  state: RenderJobState;
  progress: ExportProgress;
  outputPath: string | null;
  contentType: string | null;
  error: string | null;
  createdAt: number;
};

function jobDirFor(jobId: string) {
  return path.join(tmpdir(), `captions-${jobId}`);
}

function isValidJobId(jobId: string) {
  return JOB_ID_PATTERN.test(jobId);
}

async function persistJobState(jobId: string) {
  const job = renderJobs.get(jobId);
  if (!job) return;
  const statePath = path.join(job.jobDir, "state.json");
  const payload: PersistedJobState = {
    id: job.id,
    state: job.state,
    progress: job.progress,
    outputPath: job.outputPath,
    contentType: job.contentType,
    error: job.error,
    createdAt: job.createdAt,
  };
  try {
    await mkdir(job.jobDir, { recursive: true });
    await writeFile(statePath, JSON.stringify(payload));
  } catch {
    // best-effort persistence; never fail the render for this
  }
}

async function readPersistedJob(jobId: string): Promise<RenderJob | null> {
  if (!isValidJobId(jobId)) return null;
  const jobDir = jobDirFor(jobId);
  try {
    const raw = await readFile(path.join(jobDir, "state.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedJobState>;
    if (!parsed.id || parsed.id !== jobId || !parsed.state || !parsed.progress) {
      return null;
    }
    return {
      id: parsed.id,
      state: parsed.state,
      progress: parsed.progress,
      createdAt: parsed.createdAt ?? Date.now(),
      outputPath: parsed.outputPath ?? null,
      contentType: parsed.contentType ?? null,
      jobDir,
      error: parsed.error ?? null,
      cancel: null,
      cleanupTimer: null,
    };
  } catch {
    return null;
  }
}

async function lookupJob(jobId: string): Promise<RenderJob | null> {
  const inMemory = renderJobs.get(jobId);
  if (inMemory) return inMemory;
  return readPersistedJob(jobId);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const propsRaw = form.get("props");
  const quality = resolveExportQuality(form.get("quality"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' upload." }, { status: 400 });
  }

  if (typeof propsRaw !== "string") {
    return NextResponse.json({ error: "Missing 'props' payload." }, { status: 400 });
  }

  let body: RenderBody;
  try {
    body = JSON.parse(propsRaw) as RenderBody;
  } catch {
    return NextResponse.json({ error: "Invalid 'props' JSON." }, { status: 400 });
  }

  const codec = CODEC_BY_FORMAT[body.format];
  if (!codec) {
    return NextResponse.json(
      { error: `Unsupported format: ${body.format}` },
      { status: 400 },
    );
  }

  const jobId = randomUUID();
  const jobDir = jobDirFor(jobId);

  renderJobs.set(jobId, {
    id: jobId,
    state: "queued",
    progress: {
      phase: "preparing",
      progress: 0.02,
      label: "Preparing render job…",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: body.durationInFrames,
    },
    createdAt: Date.now(),
    outputPath: null,
    contentType: null,
    jobDir,
    error: null,
    cancel: null,
    cleanupTimer: null,
  });

  await persistJobState(jobId);

  void runRenderJob({
    jobId,
    file,
    body,
    codec,
    quality,
    jobDir,
  });

  return NextResponse.json({ jobId });
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!jobId || !isValidJobId(jobId)) {
    return NextResponse.json({ error: "Missing or invalid 'jobId'." }, { status: 400 });
  }

  const job = await lookupJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  }

  if (!download) {
    return NextResponse.json(toResponse(job));
  }

  if (job.state !== "completed" || !job.outputPath || !job.contentType) {
    return NextResponse.json(
      { error: "Render job is not ready for download." },
      { status: 409 },
    );
  }

  const rendered = await readFile(job.outputPath);
  const contentType = job.contentType;
  void cleanupJob(jobId);

  return new NextResponse(new Uint8Array(rendered), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(rendered.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (!jobId || !isValidJobId(jobId)) {
    return NextResponse.json({ error: "Missing or invalid 'jobId'." }, { status: 400 });
  }

  const job = await lookupJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  }

  job.cancel?.();
  await updateJob(jobId, {
    state: "cancelled",
    progress: {
      ...job.progress,
      phase: "finalizing",
      label: "Cancelling render…",
    },
    error: "Render cancelled",
  });

  return NextResponse.json({ ok: true });
}

async function runRenderJob({
  jobId,
  file,
  body,
  codec,
  quality,
  jobDir,
}: {
  jobId: string;
  file: File;
  body: RenderBody;
  codec: Codec;
  quality: ExportQuality;
  jobDir: string;
}) {
  let assetServer: AssetServer | null = null;

  try {
    const { cancelSignal, cancel } = makeCancelSignal();
    updateJob(jobId, { cancel });

    await mkdir(jobDir, { recursive: true });

    const sourceExt = guessExtension(file.name, file.type);
    const sourcePath = path.join(jobDir, `source${sourceExt}`);
    const outputPath = path.join(
      jobDir,
      `output.${body.format === "mp4" ? "mp4" : "webm"}`,
    );

    updateJob(jobId, {
      state: "queued",
      progress: {
        phase: "preparing",
        progress: 0.06,
        label: "Uploading source video…",
        renderedFrames: 0,
        encodedFrames: 0,
        totalFrames: body.durationInFrames,
      },
    });

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(sourcePath, Buffer.from(arrayBuffer));

    assetServer = await startAssetServer(sourcePath);

    const inputProps: RenderInputProps = {
      videoSrc: assetServer.url,
      captions: body.captions,
      styleId: body.styleId,
      styleOptions: body.styleOptions,
      assistOptions: body.assistOptions,
      forcedBreaks: body.forcedBreaks ?? null,
      width: body.width,
      height: body.height,
      durationInFrames: body.durationInFrames,
      fps: body.fps,
    };

    const serveUrl = await getServeUrl();

    updateJob(jobId, {
      state: "queued",
      progress: {
        phase: "preparing",
        progress: 0.12,
        label: "Loading Remotion composition…",
        renderedFrames: 0,
        encodedFrames: 0,
        totalFrames: body.durationInFrames,
      },
    });

    const composition = await selectComposition({
      serveUrl,
      id: "captioned-video",
      inputProps,
      offthreadVideoThreads: getOffthreadVideoThreads(),
    });

    updateJob(jobId, {
      state: "rendering",
      progress: {
        phase: "rendering",
        progress: 0.15,
        label: "Rendering frames…",
        renderedFrames: 0,
        encodedFrames: 0,
        totalFrames: body.durationInFrames,
      },
    });

    const onProgress: RenderMediaOnProgress = ({
      progress,
      renderedFrames,
      encodedFrames,
      stitchStage,
    }) => {
      const phase = stitchStageToPhase(stitchStage);
      updateJob(jobId, {
        state: "rendering",
        progress: {
          phase,
          progress: clampProgress(progress),
          label: getProgressLabel(phase, renderedFrames, body.durationInFrames),
          renderedFrames,
          encodedFrames,
          totalFrames: body.durationInFrames,
        },
      });
    };

    await renderMedia({
      composition,
      serveUrl,
      codec,
      outputLocation: outputPath,
      inputProps,
      videoBitrate: BITRATE_BY_QUALITY[quality],
      concurrency: getRenderConcurrency(quality),
      scale: SCALE_BY_QUALITY[quality],
      x264Preset: codec === "h264" ? H264_PRESET_BY_QUALITY[quality] : undefined,
      hardwareAcceleration:
        codec === "h264" && platform() === "darwin" ? "if-possible" : undefined,
      offthreadVideoThreads: getOffthreadVideoThreads(),
      cancelSignal,
      onProgress,
      logLevel: "warn",
    });

    updateJob(jobId, {
      state: "completed",
      outputPath,
      contentType: body.format === "mp4" ? "video/mp4" : "video/webm",
      cancel: null,
      progress: {
        phase: "done",
        progress: 1,
        label: "Render complete",
        renderedFrames: body.durationInFrames,
        encodedFrames: body.durationInFrames,
        totalFrames: body.durationInFrames,
      },
    });
    scheduleCleanup(jobId);
  } catch (err) {
    const isCancelled =
      err instanceof Error && err.message.includes("got cancelled");
    const currentProgress = getJob(jobId)?.progress ?? {
      phase: "finalizing" as const,
      progress: 0,
      label: "Render failed",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: body.durationInFrames,
    };

    updateJob(jobId, {
      state: isCancelled ? "cancelled" : "failed",
      cancel: null,
      error: isCancelled
        ? "Render cancelled"
        : err instanceof Error
          ? err.message
          : "Render failed",
      progress: {
        ...currentProgress,
        phase: "finalizing",
        label: isCancelled ? "Render cancelled" : "Render failed",
      },
    });

    if (isCancelled) {
      void cleanupJob(jobId);
    } else {
      scheduleCleanup(jobId);
    }
  } finally {
    assetServer?.close();
  }
}

async function updateJob(jobId: string, patch: Partial<RenderJob>) {
  const current = renderJobs.get(jobId);
  if (!current) return;
  renderJobs.set(jobId, { ...current, ...patch });
  const persistableKeys: Array<keyof RenderJob> = [
    "state",
    "progress",
    "outputPath",
    "contentType",
    "error",
  ];
  if (persistableKeys.some((key) => key in patch)) {
    await persistJobState(jobId);
  }
}

function getJob(jobId: string) {
  return renderJobs.get(jobId) ?? null;
}

function toResponse(job: RenderJob) {
  return {
    id: job.id,
    state: job.state,
    progress: job.progress,
    error: job.error,
  };
}

function scheduleCleanup(jobId: string) {
  const job = renderJobs.get(jobId);
  if (!job) return;
  if (job.cleanupTimer) {
    clearTimeout(job.cleanupTimer);
  }
  job.cleanupTimer = setTimeout(() => {
    void cleanupJob(jobId);
  }, JOB_RETENTION_MS);
}

async function cleanupJob(jobId: string) {
  const job = renderJobs.get(jobId);
  if (job?.cleanupTimer) {
    clearTimeout(job.cleanupTimer);
  }
  renderJobs.delete(jobId);
  const jobDir = job?.jobDir ?? (isValidJobId(jobId) ? jobDirFor(jobId) : null);
  if (jobDir) {
    await rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function resolveExportQuality(raw: FormDataEntryValue | null) {
  if (raw === "high" || raw === "medium" || raw === "low") {
    return raw;
  }
  return "high";
}

function getRenderConcurrency(quality: ExportQuality) {
  const cpuThreads = availableParallelism();
  const cpuShare =
    quality === "high" ? 0.6 : quality === "medium" ? 0.75 : 0.9;
  return Math.max(2, Math.floor(cpuThreads * cpuShare));
}

function getOffthreadVideoThreads() {
  return Math.min(4, Math.max(2, Math.floor(availableParallelism() / 2)));
}

function stitchStageToPhase(
  stitchStage: "encoding" | "muxing" | undefined,
) {
  if (stitchStage === "muxing") {
    return "muxing";
  }
  return "rendering";
}

function clampProgress(progress: number) {
  return Math.max(0.15, Math.min(progress, 0.99));
}

function getProgressLabel(
  phase: ExportRenderPhase,
  renderedFrames: number,
  totalFrames: number,
) {
  if (phase === "muxing") {
    return "Muxing audio and video…";
  }
  return `Rendering frames… ${Math.min(renderedFrames, totalFrames)}/${totalFrames}`;
}

type AssetServer = {
  url: string;
  close: () => void;
};

async function startAssetServer(filePath: string) {
  const size = (await stat(filePath)).size;
  const basename = path.basename(filePath);
  const server: Server = createServer((req, res) => {
    if (!req.url || !req.url.startsWith(`/${basename}`)) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const range = req.headers.range;
    const mime = mimeFromPath(filePath);

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : size - 1;
        if (isNaN(start) || isNaN(end) || start > end || end >= size) {
          res.statusCode = 416;
          res.setHeader("Content-Range", `bytes */${size}`);
          res.end();
          return;
        }
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", String(end - start + 1));
        res.setHeader("Content-Type", mime);
        createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }

    res.statusCode = 200;
    res.setHeader("Content-Length", String(size));
    res.setHeader("Content-Type", mime);
    res.setHeader("Accept-Ranges", "bytes");
    createReadStream(filePath).pipe(res);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to bind asset server");
  }

  return {
    url: `http://127.0.0.1:${address.port}/${basename}`,
    close: () => {
      server.closeAllConnections?.();
      server.close();
    },
  };
}

function mimeFromPath(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".mp4" || ext === ".m4v") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  return "application/octet-stream";
}

function guessExtension(name: string, type: string) {
  const fromName = path.extname(name);
  if (fromName) return fromName;
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("webm")) return ".webm";
  if (type.includes("quicktime")) return ".mov";
  return ".mp4";
}
