import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { availableParallelism, platform } from "node:os";
import path from "node:path";
import type { Codec, RenderMediaOnProgress } from "@remotion/renderer";
import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import {
  getServeUrl,
  subscribeToBundleProgress,
} from "../lib/remotion-bundle.ts";
import {
  HEARTBEAT_INTERVAL_MS,
  PERSIST_THROTTLE_MS,
  isValidJobId,
  readJobConfig,
  readJobState,
  touchJobState,
  writeJobState,
  type PersistedJobState,
} from "../lib/render-job.ts";
import type { ExportProgress, ExportQuality } from "../lib/video-export.ts";

const jobId = process.argv[2];
if (!jobId || !isValidJobId(jobId)) {
  console.error("[render-worker] Missing or invalid jobId");
  process.exit(1);
}

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

type AssetServer = {
  url: string;
  close: () => void;
};

function parseIntEnv(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
}

function getRenderConcurrency(quality: ExportQuality) {
  const override = parseIntEnv("REMOTION_CONCURRENCY");
  if (override) return override;
  const cpuThreads = availableParallelism();
  const cpuShare =
    quality === "high" ? 0.5 : quality === "medium" ? 0.65 : 0.8;
  const byCpu = Math.max(1, Math.floor(cpuThreads * cpuShare));
  // Containerized deploys (Railway, Fly, etc.) usually have far less RAM
  // than the host CPU count would suggest. Each Chrome tab ≈ 200-400MB,
  // so we cap at 2 unless REMOTION_CONCURRENCY says otherwise.
  return Math.min(2, byCpu);
}

function getOffthreadVideoThreads() {
  const override = parseIntEnv("REMOTION_OFFTHREAD_THREADS");
  if (override) return override;
  return Math.min(2, Math.max(1, Math.floor(availableParallelism() / 4)));
}

function getOffthreadVideoCacheBytes() {
  const mb = parseIntEnv("REMOTION_VIDEO_CACHE_MB") ?? 256;
  return mb * 1024 * 1024;
}

function mimeFromPath(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".mp4" || ext === ".m4v") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  return "application/octet-stream";
}

async function startAssetServer(filePath: string): Promise<AssetServer> {
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

function clampProgress(progress: number) {
  return Math.max(0.15, Math.min(progress, 0.99));
}

async function main() {
  const config = await readJobConfig(jobId);
  if (!config) {
    console.error(`[render-worker:${jobId}] Missing config`);
    process.exit(1);
  }

  const existing = await readJobState(jobId);
  let currentState: PersistedJobState = {
    id: jobId,
    state: "queued",
    progress: existing?.progress ?? {
      phase: "preparing",
      progress: 0.04,
      label: "Preparing export…",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: config.durationInFrames,
    },
    outputPath: null,
    contentType: null,
    error: null,
    createdAt: existing?.createdAt ?? Date.now(),
    workerPid: process.pid,
  };
  let lastPersistAt = 0;

  async function update(patch: Partial<PersistedJobState>, force = false) {
    currentState = { ...currentState, ...patch };
    const now = Date.now();
    const terminal =
      currentState.state === "completed" ||
      currentState.state === "failed" ||
      currentState.state === "cancelled";
    if (!force && !terminal && now - lastPersistAt < PERSIST_THROTTLE_MS) {
      return;
    }
    lastPersistAt = now;
    await writeJobState(jobId, currentState);
  }

  await update({}, true);

  const { cancelSignal, cancel } = makeCancelSignal();
  const onCancelSignal = () => {
    console.log(`[render-worker:${jobId}] received termination signal`);
    try {
      cancel();
    } catch {
      /* ignore */
    }
  };
  process.on("SIGTERM", onCancelSignal);
  process.on("SIGINT", onCancelSignal);

  const heartbeat = setInterval(() => {
    void touchJobState(jobId);
  }, HEARTBEAT_INTERVAL_MS);

  let assetServer: AssetServer | null = null;

  try {
    assetServer = await startAssetServer(config.sourcePath);

    const unsubscribeBundle = subscribeToBundleProgress((percent) => {
      if (percent <= 0 || percent >= 100) return;
      void update({
        state: "queued",
        progress: {
          ...currentState.progress,
          progress: 0.04 + (percent / 100) * 0.08,
          label: "Preparing export…",
        },
      });
    });

    let serveUrl: string;
    try {
      serveUrl = await getServeUrl();
    } finally {
      unsubscribeBundle();
    }

    const inputProps = {
      videoSrc: assetServer.url,
      captions: config.captions,
      styleId: config.styleId,
      styleOptions: config.styleOptions,
      width: config.width,
      height: config.height,
      durationInFrames: config.durationInFrames,
      fps: config.fps,
    };

    const composition = await selectComposition({
      serveUrl,
      id: "captioned-video",
      inputProps,
      offthreadVideoThreads: getOffthreadVideoThreads(),
    });

    await update(
      {
        state: "rendering",
        progress: {
          phase: "rendering",
          progress: 0.15,
          label: "Rendering…",
          renderedFrames: 0,
          encodedFrames: 0,
          totalFrames: config.durationInFrames,
        },
      },
      true,
    );

    const onProgress: RenderMediaOnProgress = ({
      progress,
      renderedFrames,
      encodedFrames,
      stitchStage,
    }) => {
      const phase: ExportProgress["phase"] =
        stitchStage === "muxing" ? "muxing" : "rendering";
      void update({
        state: "rendering",
        progress: {
          phase,
          progress: clampProgress(progress),
          label: phase === "muxing" ? "Finalizing…" : "Rendering…",
          renderedFrames,
          encodedFrames,
          totalFrames: config.durationInFrames,
        },
      });
    };

    const concurrency = getRenderConcurrency(config.quality);
    const offthreadThreads = getOffthreadVideoThreads();
    const videoCache = getOffthreadVideoCacheBytes();
    console.log(
      `[render-worker:${jobId}] starting renderMedia concurrency=${concurrency} offthreadThreads=${offthreadThreads} videoCache=${(videoCache / 1024 / 1024).toFixed(0)}MB cpuThreads=${availableParallelism()}`,
    );

    await renderMedia({
      composition,
      serveUrl,
      codec: config.codec as Codec,
      outputLocation: config.outputPath,
      inputProps,
      videoBitrate: BITRATE_BY_QUALITY[config.quality],
      concurrency,
      scale: SCALE_BY_QUALITY[config.quality],
      x264Preset:
        config.codec === "h264"
          ? H264_PRESET_BY_QUALITY[config.quality]
          : undefined,
      hardwareAcceleration:
        config.codec === "h264" && platform() === "darwin"
          ? "if-possible"
          : undefined,
      offthreadVideoThreads: offthreadThreads,
      offthreadVideoCacheSizeInBytes: videoCache,
      cancelSignal,
      onProgress,
      logLevel: "warn",
    });

    await update(
      {
        state: "completed",
        outputPath: config.outputPath,
        contentType: config.format === "mp4" ? "video/mp4" : "video/webm",
        workerPid: null,
        progress: {
          phase: "done",
          progress: 1,
          label: "Export ready",
          renderedFrames: config.durationInFrames,
          encodedFrames: config.durationInFrames,
          totalFrames: config.durationInFrames,
        },
      },
      true,
    );

    clearInterval(heartbeat);
    assetServer?.close();
    process.exit(0);
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const isCancelled = rawMsg.includes("got cancelled");
    const isOom =
      rawMsg.includes("SIGKILL") ||
      rawMsg.includes("Compositor quit") ||
      rawMsg.includes("out of memory");
    const friendlyError = isCancelled
      ? "Render cancelled"
      : isOom
        ? "Render ran out of memory. Upgrade the Railway plan for more RAM, or lower REMOTION_CONCURRENCY / pick a lower export quality."
        : rawMsg || "Render failed";
    await update(
      {
        state: isCancelled ? "cancelled" : "failed",
        workerPid: null,
        error: friendlyError,
        progress: {
          ...currentState.progress,
          phase: "finalizing",
          label: isCancelled ? "Render cancelled" : "Render failed",
        },
      },
      true,
    );
    clearInterval(heartbeat);
    assetServer?.close();
    process.exit(isCancelled ? 0 : 1);
  }
}

void main();
