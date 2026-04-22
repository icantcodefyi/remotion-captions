"use client";

import type { ComponentType } from "react";
import type { CaptionStyleId } from "@/lib/types";
import { TikTokStyle } from "./tiktok";
import { HormoziStyle } from "./hormozi";
import { BeastStyle } from "./beast";
import { KaraokeStyle } from "./karaoke";
import { MinimalStyle } from "./minimal";
import { NeonStyle } from "./neon";
import { TypewriterStyle } from "./typewriter";
import { BroadcastStyle } from "./broadcast";
import { ComicStyle } from "./comic";
import { GlitchStyle } from "./glitch";
import type { CaptionStyleProps } from "./types";

export const STYLE_REGISTRY: Record<
  CaptionStyleId,
  ComponentType<CaptionStyleProps>
> =
  {
    tiktok: TikTokStyle,
    hormozi: HormoziStyle,
    beast: BeastStyle,
    karaoke: KaraokeStyle,
    minimal: MinimalStyle,
    neon: NeonStyle,
    typewriter: TypewriterStyle,
    broadcast: BroadcastStyle,
    comic: ComicStyle,
    glitch: GlitchStyle,
  };
