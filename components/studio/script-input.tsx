"use client";

import Link from "next/link";
import { type FC, useId } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SectionLabel } from "@/components/ui/label";
import { getBlogHref } from "@/lib/site";

type Props = {
  script: string;
  onScriptChange: (v: string) => void;
  disabled?: boolean;
};

export const ScriptInput: FC<Props> = ({
  script,
  onScriptChange,
  disabled,
}) => {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <SectionLabel>
          Script
          <span className="ital-label normal-case tracking-normal text-[0.7rem] text-[color:var(--muted-soft)]">
            optional
          </span>
        </SectionLabel>
        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] text-[color:var(--muted)] ital-label">
            matched to your video
          </span>
        </div>
      </div>
      <Textarea
        id={id}
        aria-describedby={hintId}
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        placeholder="Paste the exact words your video should show. Leave blank to auto-transcribe."
        rows={5}
        disabled={disabled}
      />
      <p
        id={hintId}
        className="text-[0.75rem] text-[color:var(--muted)] leading-relaxed"
      >
        When you provide a script we transcribe for timing, then snap your
        exact words on top so captions read exactly as written.
      </p>
    </div>
  );
};
