"use client";

import { type FC, useRef, useState } from "react";
import Image from "next/image";
import { Film, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

const ACCEPTED = "video/*,audio/*";

const formatSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
};

export const VideoDropzone: FC<Props> = ({
  file,
  onFileChange,
  disabled,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("video/") && !f.type.startsWith("audio/")) {
      return;
    }
    onFileChange(f);
  };

  if (file) {
    const subtitle = file.type
      ? file.type.split("/")[0]
      : "file";
    return (
      <div
        className="fade-rise flex items-center gap-3 rounded-xl px-3 py-2.5 border border-[color:var(--border)] bg-[var(--surface-2)]/60"
        role="group"
        aria-label="Selected source"
      >
        <div
          className="h-10 w-10 shrink-0 rounded-md flex items-center justify-center"
          style={{
            background: "var(--accent-soft)",
            border:
              "1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
          }}
        >
          <Film
            className="h-[15px] w-[15px]"
            style={{ color: "var(--accent-ink)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.8125rem] font-medium truncate text-[color:var(--fg)]">
            {file.name}
          </div>
          <div className="text-[0.7rem] text-[color:var(--muted)] mt-0.5 flex items-baseline gap-1.5">
            <span className="tnum-serif">{formatSize(file.size)}</span>
            <span aria-hidden>·</span>
            <span className="ital-label">{subtitle}</span>
          </div>
        </div>
        <button
          type="button"
          className={cn(
            "h-9 w-9 rounded-md flex items-center justify-center",
            "text-[color:var(--muted)]",
            "transition-colors duration-200",
            "[@media(hover:hover)]:hover:text-[color:var(--danger)]",
            "[@media(hover:hover)]:hover:bg-[var(--danger-soft)]",
            "[@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11",
          )}
          onClick={() => onFileChange(null)}
          disabled={disabled}
          aria-label="Remove video"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      disabled={disabled}
      aria-label="Upload video or audio"
      className={cn(
        "relative group w-full text-center",
        "flex flex-col items-center justify-center",
        "rounded-xl border border-dashed px-5 py-8",
        "transition-[transform,background,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "disabled:pointer-events-none disabled:opacity-50",
        dragOver
          ? "border-[color:var(--accent)] bg-[var(--accent-soft)] scale-[1.01] shadow-[0_0_0_4px_var(--accent-glow)]"
          : [
              "border-[color:var(--border-strong)] bg-[var(--surface-2)]/50",
              "[@media(hover:hover)]:hover:border-[color:var(--accent-edge)]",
              "[@media(hover:hover)]:hover:bg-[color-mix(in_oklab,var(--accent-soft)_40%,transparent)]",
              "[@media(hover:hover)]:hover:-translate-y-[1px]",
            ].join(" "),
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        className={cn(
          "relative h-16 w-16 flex items-center justify-center mb-3",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          dragOver
            ? "scale-110 -translate-y-0.5"
            : "[@media(hover:hover)]:group-hover:-translate-y-0.5 [@media(hover:hover)]:group-hover:scale-[1.04]",
        )}
      >
        <Image
          src="/cat-in-box.png"
          alt=""
          width={60}
          height={60}
          priority
          className="h-14 w-14 object-contain logo-invert"
          draggable={false}
        />
      </div>
      <div className="text-[0.875rem] font-medium text-[color:var(--fg)]">
        Drop a clip, or click to pick one
      </div>
      <div className="text-[0.7rem] text-[color:var(--muted)] mt-1 flex items-baseline gap-1.5">
        <span className="ital-label">accepts</span>
        <span className="tnum-serif">mp4 · mov · webm · m4a</span>
      </div>
    </button>
  );
};
