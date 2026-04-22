import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import type { StyleOptions } from "./types";

export type ExportFormat = "mp4" | "webm";
export type ExportQuality = "high" | "medium" | "low";

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

type MediaRecorderCtor = typeof MediaRecorder;

export function getSupportedExportFormats(): ExportFormat[] {
  if (typeof window === "undefined") return [];
  const MR = (window as unknown as { MediaRecorder?: MediaRecorderCtor })
    .MediaRecorder;
  if (!MR) return [];
  const supported: ExportFormat[] = [];
  if (MR.isTypeSupported("video/mp4")) supported.push("mp4");
  if (MR.isTypeSupported("video/webm")) supported.push("webm");
  return supported;
}

function pickMimeType(format: ExportFormat): string {
  const candidates =
    format === "mp4"
      ? [
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4;codecs=avc1.42E01E",
          "video/mp4",
        ]
      : [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return format === "mp4" ? "video/mp4" : "video/webm";
}

type ExportArgs = {
  file: File;
  captions: Caption[];
  styleOptions: StyleOptions;
  format: ExportFormat;
  quality: ExportQuality;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

export async function exportCaptionedVideo({
  file,
  captions,
  styleOptions,
  format,
  quality,
  onProgress,
  signal,
}: ExportArgs): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = objectUrl;
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.preload = "auto";
  video.muted = false;

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        reject(new Error("Could not load video"));
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);
    });

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const duration = isFinite(video.duration) ? video.duration : 0;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas not available");

    const combineMs = Math.max(
      400,
      Math.round(styleOptions.wordsPerPage * 380),
    );
    const { pages } =
      captions.length > 0
        ? createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: combineMs,
          })
        : { pages: [] as ReturnType<typeof createTikTokStyleCaptions>["pages"] };

    const fps = 30;
    const canvasStream = canvas.captureStream(fps);

    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    let audioCtx: AudioContext | null = null;
    const audioTracks: MediaStreamTrack[] = [];
    if (AC) {
      try {
        audioCtx = new AC();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        audioTracks.push(...dest.stream.getAudioTracks());
      } catch {
        audioCtx = null;
      }
    }

    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ]);

    const mimeType = pickMimeType(format);
    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: EXPORT_QUALITY_BITRATE[quality],
      audioBitsPerSecond: 128_000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return await new Promise<Blob>((resolve, reject) => {
      let rafId = 0;
      let settled = false;

      const cleanup = () => {
        cancelAnimationFrame(rafId);
        try {
          video.pause();
        } catch {}
        canvasStream.getTracks().forEach((t) => t.stop());
        audioTracks.forEach((t) => t.stop());
        if (audioCtx) audioCtx.close().catch(() => undefined);
        URL.revokeObjectURL(objectUrl);
      };

      const fail = (err: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err instanceof Error ? err : new Error("Export failed"));
      };

      const done = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(new Blob(chunks, { type: mimeType }));
      };

      if (signal) {
        if (signal.aborted) {
          fail(new DOMException("Aborted", "AbortError"));
          return;
        }
        signal.addEventListener("abort", () => {
          if (recorder.state !== "inactive") {
            try {
              recorder.stop();
            } catch {}
          }
          fail(new DOMException("Aborted", "AbortError"));
        });
      }

      recorder.onstop = () => done();
      recorder.onerror = () => fail(new Error("Recording failed"));

      const draw = () => {
        if (settled) return;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(video, 0, 0, width, height);

        const tMs = video.currentTime * 1000;
        const active = pages.find(
          (p) => tMs >= p.startMs && tMs < p.startMs + Math.max(p.durationMs, combineMs),
        );
        if (active) drawCaption(ctx, active.text, styleOptions, width, height);

        if (duration > 0 && onProgress) {
          onProgress(Math.min(1, video.currentTime / duration));
        }

        if (video.ended) {
          if (recorder.state === "recording") {
            try {
              recorder.stop();
            } catch (err) {
              fail(err);
            }
          }
          return;
        }

        rafId = requestAnimationFrame(draw);
      };

      const onEnded = () => {
        if (recorder.state === "recording") {
          try {
            recorder.stop();
          } catch (err) {
            fail(err);
          }
        }
      };

      video.addEventListener("ended", onEnded);

      try {
        recorder.start();
      } catch (err) {
        fail(err);
        return;
      }

      video.currentTime = 0;
      video
        .play()
        .then(() => {
          rafId = requestAnimationFrame(draw);
        })
        .catch((err) => fail(err));
    });
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: StyleOptions,
  width: number,
  height: number,
) {
  const base = Math.min(width, height);
  const fontSize = Math.max(
    20,
    Math.round(base * 0.06 * Math.max(0.6, options.fontScale)),
  );
  const cx = Math.round(width * options.position.x);
  const cy = Math.round(height * options.position.y);

  const maxWidth = Math.round(width * 0.82);
  const upper = text.toUpperCase();

  ctx.save();
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapText(ctx, upper, maxWidth);
  const lineHeight = Math.round(fontSize * 1.15);
  const totalH = lineHeight * lines.length;
  const startY = cy - totalH / 2 + lineHeight / 2;

  const stroke = Math.max(2, Math.round(fontSize * 0.09));

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;

    if (options.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = Math.round(fontSize * 0.18);
      ctx.shadowOffsetY = Math.round(fontSize * 0.05);
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = stroke;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(line, cx, y);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = options.accentColor || "#FFFFFF";
    ctx.fillText(line, cx, y);
  });

  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = words[i];
    } else {
      current = candidate;
    }
  }
  lines.push(current);
  return lines;
}
