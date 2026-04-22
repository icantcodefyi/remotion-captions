"use client";

import { type FC, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Caption } from "@remotion/captions";
import { cn } from "@/lib/cn";

type Props = {
  peaks: Float32Array | null;
  durationMs: number;
  captions: Caption[];
  currentMs: number;
  activeIndex: number;
  isLoading: boolean;
  onSeek: (ms: number) => void;
  onWordSelect: (index: number) => void;
};

const HEIGHT = 56;

export const TranscriptWaveform: FC<Props> = ({
  peaks,
  durationMs,
  captions,
  currentMs,
  activeIndex,
  isLoading,
  onSeek,
  onWordSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.round(e.contentRect.width));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const mo = new MutationObserver(() => setThemeTick((t) => t + 1));
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const colorFg = css.getPropertyValue("--fg").trim() || "#1a1a1a";
    const colorAccent = css.getPropertyValue("--accent").trim() || "#c4ff3d";
    const colorAccentSoft =
      css.getPropertyValue("--accent-soft").trim() || "#eefbb5";
    const colorBorder = css.getPropertyValue("--border").trim() || "#e5e5e5";

    ctx.clearRect(0, 0, width, HEIGHT);

    const msToX = (ms: number) =>
      durationMs > 0 ? (ms / durationMs) * width : 0;

    if (activeIndex >= 0 && captions[activeIndex]) {
      const w = captions[activeIndex];
      const x0 = msToX(w.startMs);
      const x1 = msToX(w.endMs);
      ctx.fillStyle = colorAccentSoft;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x0, 0, Math.max(1, x1 - x0), HEIGHT);
      ctx.globalAlpha = 1;
    }

    if (peaks && peaks.length > 0) {
      const mid = HEIGHT / 2;
      const barWidth = Math.max(1, width / peaks.length);
      const inv = peaks.length / Math.max(1, width);
      ctx.fillStyle = colorFg;
      ctx.globalAlpha = 0.32;
      for (let x = 0; x < width; x += barWidth) {
        const start = Math.floor(x * inv);
        const end = Math.min(peaks.length, Math.floor((x + barWidth) * inv));
        let peak = 0;
        for (let i = start; i < end; i++) {
          if (peaks[i] > peak) peak = peaks[i];
        }
        const h = Math.max(1.2, peak * (HEIGHT - 8));
        ctx.fillRect(x, mid - h / 2, Math.max(1, barWidth - 0.5), h);
      }
      ctx.globalAlpha = 1;
    } else if (isLoading) {
      const mid = HEIGHT / 2;
      ctx.strokeStyle = colorBorder;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = colorBorder;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < captions.length; i++) {
      const x = Math.round(msToX(captions[i].startMs)) + 0.5;
      ctx.moveTo(x, HEIGHT - 6);
      ctx.lineTo(x, HEIGHT - 1);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    const playX = msToX(currentMs);
    ctx.strokeStyle = colorAccent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(playX + 0.5, 0);
    ctx.lineTo(playX + 0.5, HEIGHT);
    ctx.stroke();
    ctx.fillStyle = colorAccent;
    ctx.beginPath();
    ctx.arc(playX + 0.5, 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [
    peaks,
    durationMs,
    captions,
    currentMs,
    activeIndex,
    isLoading,
    width,
    themeTick,
  ]);

  const xToMs = useCallback(
    (clientX: number) => {
      const node = wrapperRef.current;
      if (!node || durationMs <= 0) return 0;
      const rect = node.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      return (x / rect.width) * durationMs;
    },
    [durationMs],
  );

  const findCaptionAt = (ms: number) => {
    for (let i = 0; i < captions.length; i++) {
      if (ms >= captions[i].startMs && ms < captions[i].endMs) return i;
    }
    for (let i = 0; i < captions.length; i++) {
      if (ms < captions[i].startMs) return i;
    }
    return captions.length - 1;
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    (e.target as HTMLDivElement).setPointerCapture?.(e.pointerId);
    const ms = xToMs(e.clientX);
    onSeek(ms);
    const hit = findCaptionAt(ms);
    if (hit >= 0) onWordSelect(hit);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    onSeek(xToMs(e.clientX));
  };

  return (
    <div
      ref={wrapperRef}
      role="slider"
      aria-label="Transcript scrubber"
      aria-valuemin={0}
      aria-valuemax={Math.round(durationMs)}
      aria-valuenow={Math.round(currentMs)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(durationMs, currentMs + 250));
        else if (e.key === "ArrowLeft") onSeek(Math.max(0, currentMs - 250));
        else return;
        e.preventDefault();
      }}
      className={cn(
        "relative rounded-md bg-[var(--surface-2)] border border-[color:var(--border)]",
        "cursor-pointer select-none touch-none",
        "transition-[border-color] duration-200",
        "[@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
        "focus-visible:outline-[color:var(--accent)]",
      )}
      style={{ height: HEIGHT }}
    >
      <canvas ref={canvasRef} />
      {isLoading ? (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span className="ital-label text-[0.7rem] text-[color:var(--muted)]">
            loading sound…
          </span>
        </div>
      ) : null}
    </div>
  );
};
