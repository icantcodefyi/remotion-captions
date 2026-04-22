"use client";

import { type FC, type KeyboardEvent, type MouseEvent, type ReactNode, memo, useEffect, useRef } from "react";
import type { Caption } from "@remotion/captions";
import { Split, Trash2, Merge } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTimestamp } from "@/lib/caption-edits";

type Props = {
  caption: Caption;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  canMerge: boolean;
  onSelect: (index: number) => void;
  onBeginEdit: (index: number) => void;
  onCommitEdit: (index: number, text: string) => void;
  onCancelEdit: () => void;
  onDelete: (index: number) => void;
  onSplit: (index: number, first: string, second: string) => void;
  onMergeNext: (index: number) => void;
};

const LOW_CONFIDENCE = 0.7;

export const TranscriptWordRow = memo<Props>(
  function TranscriptWordRow({
    caption,
    index,
    isActive,
    isSelected,
    isEditing,
    canMerge,
    onSelect,
    onBeginEdit,
    onCommitEdit,
    onCancelEdit,
    onDelete,
    onSplit,
    onMergeNext,
  }) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const commit = () => {
      const value = inputRef.current?.value ?? caption.text;
      onCommitEdit(index, value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = inputRef.current?.value ?? caption.text;
        if (value.includes(" ")) {
          const [first, ...rest] = value.split(/\s+/);
          onSplit(index, first, rest.join(" "));
        } else {
          commit();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancelEdit();
      }
    };

    const lowConfidence =
      caption.confidence != null && caption.confidence < LOW_CONFIDENCE;

    return (
      <div
        role="option"
        aria-selected={isSelected}
        aria-current={isActive ? "true" : undefined}
        onClick={() => onSelect(index)}
        onDoubleClick={() => onBeginEdit(index)}
        className={cn(
          "group relative flex items-baseline gap-3 px-3 py-1.5 rounded-md",
          "cursor-text select-none",
          "transition-[background,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSelected && "bg-[var(--surface-2)]",
          isActive &&
            !isSelected &&
            "bg-[color-mix(in_oklab,var(--accent-soft)_60%,transparent)]",
          isActive && isSelected && "bg-[var(--accent-soft)]",
          !isActive &&
            !isSelected &&
            "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
        )}
        style={{ height: 32 }}
      >
        <div className="relative w-[62px] shrink-0 flex items-center justify-end gap-1.5">
          <span
            aria-hidden
            className={cn(
              "absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full",
              "transition-[opacity,transform] duration-200",
              isActive
                ? "opacity-100 scale-100 bg-[var(--accent)] shadow-[0_0_0_3px_var(--accent-glow)]"
                : "opacity-0 scale-75",
            )}
          />
          <span
            className={cn(
              "tnum-serif text-[0.7rem] italic",
              isActive
                ? "text-[color:var(--accent-ink)]"
                : "text-[color:var(--muted)]",
            )}
          >
            {formatTimestamp(caption.startMs)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              defaultValue={caption.text}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              aria-label={`Edit word at ${formatTimestamp(caption.startMs)}`}
              className={cn(
                "w-full bg-transparent outline-none",
                "text-[color:var(--fg)] text-[0.9375rem] font-medium",
                "border-b border-[color:var(--accent)]",
                "pb-[1px] -mb-[1px]",
              )}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                "text-[0.9375rem] leading-[1.25]",
                isActive
                  ? "text-[color:var(--fg)] font-semibold"
                  : "text-[color:var(--fg)]",
                lowConfidence &&
                  "decoration-[color:var(--muted-soft)] decoration-wavy underline underline-offset-[3px] decoration-1",
              )}
              title={lowConfidence ? "This word may be off" : undefined}
            >
              {caption.text}
            </span>
          )}
        </div>

        {!isEditing ? (
          <div
            className={cn(
              "flex items-center gap-0.5 shrink-0 text-[color:var(--muted)]",
              "opacity-0 transition-opacity duration-150",
              "group-hover:opacity-100",
              isSelected && "opacity-100",
            )}
          >
            <RowAction
              label="Split at space"
              disabled={!caption.text.includes(" ")}
              onClick={(e) => {
                e.stopPropagation();
                const parts = caption.text.split(/\s+/);
                if (parts.length >= 2)
                  onSplit(index, parts[0], parts.slice(1).join(" "));
              }}
            >
              <Split className="h-3 w-3" />
            </RowAction>
            <RowAction
              label="Merge with next"
              disabled={!canMerge}
              onClick={(e) => {
                e.stopPropagation();
                onMergeNext(index);
              }}
            >
              <Merge className="h-3 w-3" />
            </RowAction>
            <RowAction
              label="Delete word"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </RowAction>
          </div>
        ) : null}
      </div>
    );
  },
);

const RowAction: FC<{
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}> = ({ children, label, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={cn(
      "h-6 w-6 inline-flex items-center justify-center rounded",
      "transition-[background,color,transform] duration-150",
      "disabled:opacity-30 disabled:pointer-events-none",
      "[@media(hover:hover)]:hover:bg-[var(--surface-3)]",
      "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
      "active:scale-95",
    )}
  >
    {children}
  </button>
);
