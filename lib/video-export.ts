import type { Caption } from "@remotion/captions";
import type { CaptionStyleId, StyleOptions } from "./types";

export type ExportFormat = "mp4" | "webm";
export type ExportQuality = "high" | "medium" | "low";
export type ExportRenderPhase =
  | "preparing"
  | "rendering"
  | "muxing"
  | "finalizing"
  | "done";

export type ExportProgress = {
  phase: ExportRenderPhase;
  progress: number;
  label: string;
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
};

type RenderJobState =
  | "queued"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

type RenderJobResponse = {
  id: string;
  state: RenderJobState;
  progress: ExportProgress;
  error: string | null;
};

export const EXPORT_QUALITY_BITRATE: Record<ExportQuality, number> = {
  high: 8_000_000,
  medium: 4_000_000,
  low: 2_000_000,
};

export const EXPORT_QUALITY_LABEL: Record<ExportQuality, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const EXPORT_FPS = 30;

const RENDER_POLL_MS = 350;

export function getSupportedExportFormats(): ExportFormat[] {
  return ["mp4", "webm"];
}

type ExportArgs = {
  file: File;
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  format: ExportFormat;
  quality: ExportQuality;
  width: number;
  height: number;
  durationSec: number;
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
};

export async function exportCaptionedVideo({
  file,
  captions,
  styleId,
  styleOptions,
  format,
  quality,
  width,
  height,
  durationSec,
  signal,
  onProgress,
}: ExportArgs): Promise<Blob> {
  const fps = EXPORT_FPS;
  const durationInFrames = Math.max(1, Math.round(durationSec * fps));

  const payload = {
    captions,
    styleId,
    styleOptions,
    width,
    height,
    durationInFrames,
    fps,
    format,
  };

  const formData = new FormData();
  formData.append("file", file, file.name || "source.mp4");
  formData.append("props", JSON.stringify(payload));
  formData.append("quality", quality);

  onProgress?.({
    phase: "preparing",
    progress: 0.02,
    label: "Preparing upload…",
    renderedFrames: 0,
    encodedFrames: 0,
    totalFrames: durationInFrames,
  });

  const response = await fetch("/api/render", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const message = await extractError(response);
    throw new Error(message);
  }

  const { jobId } = (await response.json()) as { jobId?: string };
  if (!jobId) {
    throw new Error("Render job did not start");
  }

  const cancelJob = () => {
    void fetch(`/api/render?jobId=${encodeURIComponent(jobId)}`, {
      method: "DELETE",
      keepalive: true,
    }).catch(() => undefined);
  };

  signal?.addEventListener("abort", cancelJob, { once: true });

  try {
    while (true) {
      throwIfAborted(signal);

      const status = await getRenderJob(jobId, signal);
      onProgress?.(status.progress);

      if (status.state === "completed") {
        onProgress?.({
          ...status.progress,
          phase: "finalizing",
          progress: 1,
          label: "Downloading export…",
        });
        return await downloadRenderedVideo(jobId, signal);
      }

      if (status.state === "failed") {
        throw new Error(status.error ?? "Render failed");
      }

      if (status.state === "cancelled") {
        throw createAbortError();
      }

      await delay(RENDER_POLL_MS, signal);
    }
  } finally {
    signal?.removeEventListener("abort", cancelJob);
  }
}

async function getRenderJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<RenderJobResponse> {
  const response = await fetch(`/api/render?jobId=${encodeURIComponent(jobId)}`, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await extractError(response);
    throw new Error(message);
  }

  return (await response.json()) as RenderJobResponse;
}

async function downloadRenderedVideo(
  jobId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(
    `/api/render?jobId=${encodeURIComponent(jobId)}&download=1`,
    {
      method: "GET",
      signal,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const message = await extractError(response);
    throw new Error(message);
  }

  return await response.blob();
}

async function extractError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as { error?: string };
      if (body.error) return body.error;
    } else {
      const text = await response.text();
      if (text) return text.slice(0, 500);
    }
  } catch {}
  return `Render failed (HTTP ${response.status})`;
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      reject(createAbortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function createAbortError() {
  return new DOMException("Render cancelled", "AbortError");
}
