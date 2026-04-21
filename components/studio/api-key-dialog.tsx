"use client";

import * as React from "react";
import { Check, ExternalLink, Eye, EyeOff, KeyRound, Trash2, X } from "lucide-react";
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
  if (!open) return null;
  return (
    <ApiKeyDialogBody
      onOpenChange={onOpenChange}
      currentKey={currentKey}
      onSave={onSave}
    />
  );
};

const ApiKeyDialogBody: React.FC<Omit<Props, "open">> = ({
  onOpenChange,
  currentKey,
  onSave,
}) => {
  const [value, setValue] = React.useState(currentKey ?? "");
  const [visible, setVisible] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: "rgba(7, 7, 10, 0.72)",
        backdropFilter: "blur(10px)",
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl panel overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div className="relative px-6 pt-6 pb-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shadow-[0_0_30px_var(--color-accent-glow)]">
              <KeyRound className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Connect Deepgram
              </h2>
              <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                Your key is stored locally in this browser only.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--color-muted)]">
            API key
          </label>
          <div className="relative mt-2">
            <input
              ref={inputRef}
              type={visible ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="dg-..."
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "w-full h-11 pl-3.5 pr-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm font-mono tracking-tight text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-glow)] transition-colors",
              )}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)]"
              aria-label={visible ? "Hide" : "Show"}
            >
              {visible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <a
            href="https://console.deepgram.com/signup"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 mt-3 text-[11px] text-[var(--color-muted-strong)] hover:text-[var(--color-accent)] transition-colors"
          >
            Get a free key
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="px-6 py-4 bg-[var(--color-surface-2)]/40 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
          {currentKey ? (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5" /> Remove
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
              <Check className="h-3.5 w-3.5" /> Save key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
