"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SectionLabel } from "@/components/ui/label";

type Props = {
  script: string;
  onScriptChange: (v: string) => void;
  disabled?: boolean;
};

export const ScriptInput: React.FC<Props> = ({ script, onScriptChange, disabled }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Script (optional)</SectionLabel>
        <span className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
          <Wand2 className="h-3 w-3" /> Auto-aligned to audio
        </span>
      </div>
      <Textarea
        value={script}
        onChange={(e) => onScriptChange(e.target.value)}
        placeholder="Paste the exact words your video should show. Leave blank to auto-transcribe."
        rows={6}
        disabled={disabled}
      />
      <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
        When provided, we transcribe the audio for timing and align your script
        on top — so captions read exactly as written.
      </p>
    </div>
  );
};
