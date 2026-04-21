"use client";

import type React from "react";
import type { CaptionStyleId } from "@/lib/types";
import { TikTokStyle } from "./tiktok";
import { HormoziStyle } from "./hormozi";
import { BeastStyle } from "./beast";
import { KaraokeStyle } from "./karaoke";
import { MinimalStyle } from "./minimal";
import { NeonStyle } from "./neon";
import { TypewriterStyle } from "./typewriter";
import { BroadcastStyle } from "./broadcast";
import type { CaptionStyleProps } from "./types";

export const STYLE_REGISTRY: Record<CaptionStyleId, React.FC<CaptionStyleProps>> =
  {
    tiktok: TikTokStyle,
    hormozi: HormoziStyle,
    beast: BeastStyle,
    karaoke: KaraokeStyle,
    minimal: MinimalStyle,
    neon: NeonStyle,
    typewriter: TypewriterStyle,
    broadcast: BroadcastStyle,
  };
