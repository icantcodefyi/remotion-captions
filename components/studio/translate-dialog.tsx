"use client";

import { type FC, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, Languages, Loader2, X } from "lucide-react";
import type { Caption } from "@remotion/captions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LANGUAGES, type LanguageCode } from "@/lib/translate";
import { OPENAI_KEY_HEADER } from "@/lib/llm-key";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  captions: Caption[] | null;
  wordsPerPage: number;
  openaiKey: string | null;
  onOpenaiKeyChange: (key: string | null) => void;
  onTranslated: (captions: Caption[], language: LanguageCode) => void;
};

export const TranslateDialog: FC<Props> = ({
  open,
  onOpenChange,
  captions,
  wordsPerPage,
  openaiKey,
  onOpenaiKeyChange,
  onTranslated,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<LanguageCode>("es");
  const [running, setRunning] = useState(false);
  const [keyDraft, setKeyDraft] = useState(openaiKey ?? "");
  const [keyVisible, setKeyVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setError(null);
      setKeyDraft(openaiKey ?? "");
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, openaiKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => onOpenChange(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onOpenChange]);

  const hasCaptions = !!captions && captions.length > 0;
  const hasKey = keyDraft.trim().length > 0;
  const canRun = hasCaptions && hasKey && !running;

  const close = () => {
    if (running) return;
    onOpenChange(false);
  };

  const handleRun = async () => {
    if (!captions) return;
    const trimmedKey = keyDraft.trim();
    if (!trimmedKey) return;
    if (trimmedKey !== openaiKey) {
      onOpenaiKeyChange(trimmedKey);
    }
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [OPENAI_KEY_HEADER]: trimmedKey,
        },
        body: JSON.stringify({
          captions,
          targetLanguage: target,
          wordsPerPage,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `Translation failed (${res.status})`);
      }
      onTranslated(json.captions as Caption[], target);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 m-auto p-0 bg-transparent",
        "max-w-[520px] w-[calc(100vw-2rem)]",
        "backdrop:bg-[color-mix(in_oklab,var(--fg)_40%,transparent)]",
        "backdrop:backdrop-blur-[6px]",
        "focus:outline-none",
        "open:animate-[fade-rise_280ms_var(--ease-out-soft)]",
      )}
      aria-labelledby="translate-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
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
            onClick={close}
            disabled={running}
            className={cn(
              "absolute top-4 right-4 h-9 w-9 rounded-md flex items-center justify-center",
              "text-[color:var(--muted)] transition-colors duration-200",
              "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
              "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
              "disabled:opacity-40 disabled:pointer-events-none",
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
              <Languages
                className="h-4 w-4"
                style={{ color: "var(--accent-ink)" }}
              />
            </div>
            <div className="min-w-0">
              <h2
                id="translate-dialog-title"
                className="display text-[1.0625rem] font-semibold tracking-tight text-[color:var(--fg)] leading-none"
              >
                Translate captions
              </h2>
              <p className="text-[0.75rem] text-[color:var(--muted)] mt-1.5">
                <span className="ital-label">Same rhythm, new language.</span>{" "}
                Word timing is redistributed per sentence.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="text-[0.6875rem] uppercase tracking-[0.14em] font-semibold text-[color:var(--muted)]">
              Target language
            </div>
            <div
              role="radiogroup"
              aria-label="Target language"
              className="grid grid-cols-3 gap-1.5"
            >
              {LANGUAGES.map((lang) => {
                const selected = lang.code === target;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTarget(lang.code)}
                    disabled={running}
                    className={cn(
                      "flex flex-col items-start gap-1 h-auto py-2 px-2.5 rounded-md text-left",
                      "[@media(pointer:coarse)]:py-2.5",
                      "border transition-[background,border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      selected
                        ? "bg-[var(--surface-1)] border-[color:var(--accent-edge)] shadow-[0_0_0_3px_var(--accent-glow)]"
                        : "bg-[var(--surface-2)] border-[color:var(--border)] [@media(hover:hover)]:hover:border-[color:var(--border-strong)]",
                      "disabled:opacity-50",
                    )}
                  >
                    <span className="text-[0.8rem] font-medium text-[color:var(--fg)] leading-none">
                      {lang.native}
                    </span>
                    <span className="ital-label normal-case tracking-normal text-[0.68rem] text-[color:var(--muted)] leading-none">
                      {lang.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="openai-key"
              className="text-[0.6875rem] uppercase tracking-[0.14em] font-semibold text-[color:var(--muted)]"
            >
              OpenAI key
            </label>
            <div className="relative">
              <KeyRound
                className="absolute top-1/2 left-3 -translate-y-1/2 h-[13px] w-[13px] text-[color:var(--muted)]"
                aria-hidden
              />
              <input
                id="openai-key"
                type={keyVisible ? "text" : "password"}
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
                spellCheck={false}
                disabled={running}
                className={cn(
                  "w-full h-10 pl-8 pr-10 rounded-lg",
                  "border border-[color:var(--border)]",
                  "bg-[var(--surface-1)]",
                  "text-[0.8125rem] tracking-tight text-[color:var(--fg)]",
                  "font-[family-name:var(--font-mono)]",
                  "placeholder:text-[color:var(--muted)]",
                  "focus:border-[color:var(--accent)] focus:outline-none",
                  "focus:ring-[3px] focus:ring-[color:var(--accent-glow)]",
                  "transition-colors duration-200",
                  "shadow-[inset_0_1px_2px_oklch(20%_0.02_90/0.04)]",
                  "disabled:opacity-50",
                )}
              />
              <button
                type="button"
                onClick={() => setKeyVisible((v) => !v)}
                className={cn(
                  "absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 rounded-md",
                  "flex items-center justify-center",
                  "text-[color:var(--muted)] transition-colors duration-200",
                  "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
                  "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
                )}
                aria-label={keyVisible ? "Hide key" : "Show key"}
              >
                {keyVisible ? (
                  <EyeOff className="h-[13px] w-[13px]" />
                ) : (
                  <Eye className="h-[13px] w-[13px]" />
                )}
              </button>
            </div>
            <p className="text-[0.72rem] text-[color:var(--muted)] leading-relaxed">
              <span className="ital-label">Stored locally.</span> Used only for
              translation calls. Get one at platform.openai.com.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="text-[0.78rem] px-3 py-2 rounded-md"
              style={{
                color: "var(--danger)",
                background: "var(--danger-soft)",
                border: "1px solid color-mix(in oklab, var(--danger) 20%, transparent)",
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div
          className="px-6 py-4 flex items-center justify-between gap-2"
          style={{
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span className="ital-label normal-case tracking-normal text-[0.72rem] text-[color:var(--muted)]">
            {hasCaptions ? (
              <>
                <span className="tnum-serif">{captions!.length}</span> words
              </>
            ) : (
              "Generate captions first"
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={close}
              disabled={running}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              disabled={!canRun}
            >
              {running ? (
                <>
                  <Loader2 className="h-[13px] w-[13px] spin-slow" />
                  Translating…
                </>
              ) : (
                <>
                  <Languages className="h-[13px] w-[13px]" />
                  Translate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
