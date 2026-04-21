"use client";

import * as React from "react";
import { Check, Eye, EyeOff, KeyRound, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentKey: string | null;
  onSave: (key: string | null) => void;
};

export const ApiKeyDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  currentKey,
  onSave,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState(currentKey ?? "");
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (open) setValue(currentKey ?? "");
  }, [open, currentKey]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setTimeout(() => inputRef.current?.focus(), 60);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => onOpenChange(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onOpenChange]);

  const handleSave = () => {
    const trimmed = value.trim();
    onSave(trimmed.length > 0 ? trimmed : null);
    onOpenChange(false);
  };

  const handleClear = () => {
    onSave(null);
    setValue("");
    onOpenChange(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 m-auto p-0 bg-transparent",
        "max-w-[440px] w-[calc(100vw-2rem)]",
        "backdrop:bg-[color-mix(in_oklab,var(--fg)_40%,transparent)]",
        "backdrop:backdrop-blur-[6px]",
        "focus:outline-none",
        "open:animate-[fade-rise_280ms_var(--ease-out-soft)]",
      )}
      aria-labelledby="api-key-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-pop)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "absolute top-4 right-4 h-9 w-9 rounded-md flex items-center justify-center",
              "text-[color:var(--muted)] transition-colors duration-200",
              "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
              "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="relative h-10 w-10 rounded-xl flex items-center justify-center"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-edge)",
                boxShadow: "0 6px 18px -8px var(--accent-glow)",
              }}
            >
              <KeyRound
                className="h-4 w-4"
                style={{ color: "var(--accent-ink)" }}
              />
            </div>
            <div>
              <h2
                id="api-key-dialog-title"
                className="display text-[1.0625rem] font-semibold tracking-tight text-[color:var(--fg)]"
              >
                Add your API key
              </h2>
              <p className="text-[0.75rem] text-[color:var(--muted)] mt-0.5">
                <span className="ital-label">Stored locally</span> — never
                leaves your device.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <label
            htmlFor="deepgram-key"
            className="text-[0.6875rem] uppercase tracking-[0.14em] font-semibold text-[color:var(--muted)]"
          >
            API key
          </label>
          <div className="relative mt-2">
            <input
              ref={inputRef}
              id="deepgram-key"
              type={visible ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Paste your API key"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="deepgram-key-help"
              className={cn(
                "w-full h-11 pl-3.5 pr-11 rounded-lg",
                "border border-[color:var(--border)]",
                "bg-[var(--surface-1)]",
                "text-[0.8125rem] tracking-tight text-[color:var(--fg)]",
                "font-[family-name:var(--font-mono)]",
                "placeholder:text-[color:var(--muted)]",
                "focus:border-[color:var(--accent)] focus:outline-none",
                "focus:ring-[3px] focus:ring-[color:var(--accent-glow)]",
                "transition-colors duration-200",
                "shadow-[inset_0_1px_2px_oklch(20%_0.02_90/0.04)]",
              )}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className={cn(
                "absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 rounded-md",
                "flex items-center justify-center",
                "text-[color:var(--muted)] transition-colors duration-200",
                "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
                "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
              )}
              aria-label={visible ? "Hide key" : "Show key"}
              aria-pressed={visible}
            >
              {visible ? (
                <EyeOff className="h-[15px] w-[15px]" />
              ) : (
                <Eye className="h-[15px] w-[15px]" />
              )}
            </button>
          </div>

          <p
            id="deepgram-key-help"
            className="mt-3 text-[0.75rem] text-[color:var(--muted)] leading-relaxed"
          >
            Sent only with each transcription request. We don&apos;t keep a
            copy.
          </p>
        </div>

        <div
          className="px-6 py-4 flex items-center justify-between gap-2"
          style={{
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {currentKey ? (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="h-[13px] w-[13px]" /> Remove key
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={value.trim().length === 0}
            >
              <Check className="h-[13px] w-[13px]" /> Save key
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
