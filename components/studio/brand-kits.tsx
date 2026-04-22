"use client";

import { type FC, useState } from "react";
import { BookmarkPlus, Trash2 } from "lucide-react";
import { SectionLabel } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CAPTION_STYLES, type BrandKit } from "@/lib/types";
import { getAspectPreset } from "@/lib/aspect";

type Props = {
  kits: BrandKit[];
  activeSignature: string;
  onApply: (kit: BrandKit) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
};

export const BrandKits: FC<Props> = ({
  kits,
  activeSignature,
  onApply,
  onSave,
  onDelete,
}) => {
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState("");

  const beginSave = () => {
    setSaving(true);
    setDraftName(suggestName(kits));
  };

  const commitSave = () => {
    const name = draftName.trim();
    if (!name) return;
    onSave(name);
    setSaving(false);
    setDraftName("");
  };

  const cancelSave = () => {
    setSaving(false);
    setDraftName("");
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>Brand kit</SectionLabel>
        {!saving ? (
          <button
            type="button"
            onClick={beginSave}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[0.7rem] font-medium",
              "text-[color:var(--fg-weak)] transition-colors duration-200",
              "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
              "[@media(hover:hover)]:hover:text-[color:var(--fg)]",
            )}
            title="Save current settings as a brand kit"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span className="ital-label normal-case tracking-normal">
              save current
            </span>
          </button>
        ) : null}
      </div>

      {saving ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commitSave();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            autoFocus
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancelSave();
              }
            }}
            placeholder="Kit name"
            maxLength={40}
            className={cn(
              "flex-1 h-8 px-2.5 rounded-md text-[0.8rem]",
              "bg-[var(--surface-1)] text-[color:var(--fg)]",
              "border border-[color:var(--border-strong)]",
              "placeholder:text-[color:var(--muted-soft)]",
              "focus:outline-none focus:border-[color:var(--accent-edge)]",
              "focus:shadow-[0_0_0_3px_var(--accent-glow)]",
              "transition-[box-shadow,border-color] duration-200",
            )}
          />
          <Button type="submit" variant="primary" size="sm">
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancelSave}>
            Cancel
          </Button>
        </form>
      ) : kits.length === 0 ? (
        <p className="ital-label normal-case tracking-normal text-[0.72rem] text-[color:var(--muted)] leading-relaxed pl-0.5">
          Save this look as a kit and one click applies it to the next clip.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {kits.map((kit) => (
            <KitRow
              key={kit.id}
              kit={kit}
              active={makeSignature(kit) === activeSignature}
              onApply={() => onApply(kit)}
              onDelete={() => onDelete(kit.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const KitRow: FC<{
  kit: BrandKit;
  active: boolean;
  onApply: () => void;
  onDelete: () => void;
}> = ({ kit, active, onApply, onDelete }) => {
  const styleMeta = CAPTION_STYLES.find((s) => s.id === kit.styleId);
  const aspect = getAspectPreset(kit.aspectId);
  return (
    <li
      className={cn(
        "group relative flex items-center gap-2 h-9 rounded-md pl-1.5 pr-1",
        "[@media(pointer:coarse)]:h-11",
        "transition-[background,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? "bg-[var(--surface-2)] shadow-[inset_0_0_0_1px_var(--border)]"
          : "[@media(hover:hover)]:hover:bg-[var(--surface-2)]",
      )}
    >
      <button
        type="button"
        onClick={onApply}
        className="flex items-center gap-2 flex-1 min-w-0 h-full px-1 rounded text-left"
      >
        <span
          aria-hidden
          className="h-5 w-5 shrink-0 rounded-[5px] border border-[color:var(--border-strong)]"
          style={{
            background: kit.styleOptions.accentColor,
            boxShadow: active
              ? "0 0 0 2px var(--surface-2), 0 0 0 3px var(--accent-edge)"
              : "inset 0 1px 0 oklch(100% 0 0 / 0.2)",
          }}
        />
        <span className="flex flex-col min-w-0">
          <span className="text-[0.8rem] font-medium text-[color:var(--fg)] leading-none truncate">
            {kit.name}
          </span>
          <span className="text-[0.65rem] text-[color:var(--muted)] leading-none mt-1 truncate">
            <span>{styleMeta?.name ?? kit.styleId}</span>
            <span className="mx-1 opacity-60">·</span>
            <span className="tnum-serif">{aspect.tick}</span>
            <span className="mx-1 opacity-60">·</span>
            <span className="tnum-serif">
              {kit.styleOptions.wordsPerPage}w
            </span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete kit ${kit.name}`}
        title="Delete kit"
        className={cn(
          "h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md",
          "text-[color:var(--muted)] opacity-0 group-hover:opacity-100",
          "transition-[opacity,color,background] duration-200",
          "[@media(hover:hover)]:hover:bg-[var(--surface-1)]",
          "[@media(hover:hover)]:hover:text-[color:var(--danger)]",
          "focus-visible:opacity-100",
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
};

export function makeSignature(kit: {
  styleId: string;
  aspectId: string;
  styleOptions: {
    accentColor: string;
    wordsPerPage: number;
    fontScale: number;
    shadow: boolean;
    position: { x: number; y: number };
  };
}) {
  const o = kit.styleOptions;
  return [
    kit.styleId,
    kit.aspectId,
    o.accentColor.toLowerCase(),
    o.wordsPerPage,
    o.fontScale.toFixed(2),
    o.shadow ? "1" : "0",
    o.position.x.toFixed(2),
    o.position.y.toFixed(2),
  ].join("|");
}

function suggestName(kits: BrandKit[]): string {
  const base = "Untitled kit";
  const existing = new Set(kits.map((k) => k.name));
  if (!existing.has(base)) return base;
  for (let i = 2; i < 50; i++) {
    const name = `${base} ${i}`;
    if (!existing.has(name)) return name;
  }
  return base;
}
