"use client";

import * as React from "react";
import { UploadCloud, FilmIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export const VideoDropzone: React.FC<Props> = ({ file, onFileChange, disabled }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("video/") && !f.type.startsWith("audio/")) {
      return;
    }
    onFileChange(f);
  };

  if (file) {
    return (
      <div className="panel-2 p-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-[var(--color-surface-3)] flex items-center justify-center shrink-0">
          <FilmIcon className="h-4 w-4 text-[var(--color-accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{file.name}</div>
          <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
            {(file.size / (1024 * 1024)).toFixed(1)} MB · {file.type || "video"}
          </div>
        </div>
        <button
          type="button"
          className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)] transition-colors"
          onClick={() => onFileChange(null)}
          disabled={disabled}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
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
      className={cn(
        "relative cursor-pointer rounded-xl border border-dashed transition-all group",
        "flex flex-col items-center justify-center text-center px-5 py-8",
        dragOver
          ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)]/10"
          : "border-[var(--color-border-strong)] bg-[var(--color-surface-2)]/40 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-2)]",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-all",
          dragOver
            ? "bg-[var(--color-accent)] text-black"
            : "bg-[var(--color-surface-3)] text-[var(--color-muted-strong)] group-hover:text-[var(--color-accent)]",
        )}
      >
        <UploadCloud className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">Drop video here</div>
      <div className="text-[11px] text-[var(--color-muted)] mt-1">
        or click to browse · mp4, mov, webm, m4a
      </div>
    </div>
  );
};
