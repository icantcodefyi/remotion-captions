import { LANGUAGES } from "@/lib/translate";
import { ASPECT_PRESETS, CAPTION_STYLES } from "@/lib/types";

export type ChangelogStat = {
  label: string;
  value: string;
  note: string;
};

export type ChangelogRelease = {
  id: string;
  date: string;
  eyebrow: string;
  title: string;
  summary: string;
  highlights: string[];
};

export type ChangelogFeatureGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
};

export const CHANGELOG_VERSION = "2026-04-22-studio-pass";
export const CHANGELOG_SEEN_STORAGE_KEY = "meowcap-changelog-seen";

export const changelogStats: ChangelogStat[] = [
  {
    label: "caption styles",
    value: String(CAPTION_STYLES.length).padStart(2, "0"),
    note: "from TikTok punch to broadcast lower thirds",
  },
  {
    label: "translation targets",
    value: String(LANGUAGES.length).padStart(2, "0"),
    note: "timing-preserving caption translation",
  },
  {
    label: "canvas presets",
    value: String(ASPECT_PRESETS.length).padStart(2, "0"),
    note: "source, vertical, square, and wide",
  },
  {
    label: "export paths",
    value: "04",
    note: "MP4, WebM, SRT, and JSON from one studio",
  },
];

export const changelogFeatureGroups: ChangelogFeatureGroup[] = [
  {
    id: "ingest",
    eyebrow: "Bring footage in",
    title: "Start from a raw clip or from subtitles you already trust.",
    description:
      "MeowCap accepts both fresh source media and existing subtitle tracks, so the first step fits the way people actually work.",
    items: [
      "Drop video or audio straight into the studio.",
      "Transcribe with word-level timing through Deepgram.",
      "Paste a script and align your exact wording to the spoken audio.",
      "Import SRT, VTT, or caption JSON and continue editing instead of retranscribing.",
    ],
  },
  {
    id: "edit",
    eyebrow: "Shape the words",
    title: "Edit timing and phrasing with playback context, not guesswork.",
    description:
      "The editor stays tied to the live preview, waveform, and page groupings so fixes feel like studio work instead of spreadsheet work.",
    items: [
      "Scrub a waveform timeline while the active line follows playback.",
      "Rewrite caption lines and redistribute timing across the edited text.",
      "Undo caption edits without resetting the whole session.",
      "Preserve explicit line breaks when the script is driving page boundaries.",
    ],
  },
  {
    id: "style",
    eyebrow: "Make it look like yours",
    title: "The chrome stays quiet so the caption system can be loud on purpose.",
    description:
      "Preview styles live, tune the layout, and save reusable looks for the next clip without leaving the browser.",
    items: [
      "Preview 10 Remotion caption styles, including Comic and Glitch alongside the original core set.",
      "Tune font size, words per page, accent color, and readability shadow live.",
      "Drag captions directly on the preview to place them exactly where they belong.",
      "Switch between source, 9:16, 1:1, and 16:9 canvases with safe-zone overlays.",
      "Save and reapply brand kits for recurring caption looks.",
    ],
  },
  {
    id: "language",
    eyebrow: "Go multilingual",
    title: "Translate captions without throwing away their rhythm.",
    description:
      "Translation happens inside the app, and the redistributed timing stays mapped to the original pacing so the result is still usable on-screen.",
    items: [
      "Translate captions into 15 supported languages.",
      "Keep sentence-level context during translation instead of word-swapping line by line.",
      "Store the OpenAI key locally in the browser, just like the Deepgram key flow.",
    ],
  },
  {
    id: "deliver",
    eyebrow: "Ship the result",
    title: "Export captions, or render the final video without leaving MeowCap.",
    description:
      "The output path now covers both handoff files and baked caption video renders, with visible progress the whole way through.",
    items: [
      "Download SRT or JSON for handoff and post-production workflows.",
      "Render captioned MP4 or WebM video locally through the async Remotion job pipeline.",
      "Watch real-time export progress across preparing, rendering, muxing, and final download.",
      "Use export quality presets that make the speed-versus-size tradeoff explicit.",
    ],
  },
];

export const changelogReleases: ChangelogRelease[] = [
  {
    id: "2026-04-22-current",
    date: "2026-04-22",
    eyebrow: "Current release",
    title: "MeowCap is now a fuller caption studio, not just a caption generator.",
    summary:
      "The latest pass connects import, editing, styling, translation, and export into one calmer workflow. The app can now carry a clip much farther before you need another tool.",
    highlights: [
      "Subtitle import landed for SRT, VTT, and JSON tracks.",
      "Brand kits, translation, and expanded style coverage are all live in the same shell.",
      "The editor gained waveform-backed line editing with undo and page-aware timing redistribution.",
    ],
  },
  {
    id: "2026-04-22-render",
    date: "2026-04-22",
    eyebrow: "Render pass",
    title: "Video export grew into a real job system with progress you can trust.",
    summary:
      "Instead of a thin fire-and-forget export path, MeowCap now spins up async render jobs, reports state changes clearly, and serves the source media in a way Remotion can render reliably.",
    highlights: [
      "MP4 and WebM exports now run through async polling jobs.",
      "Progress labels mirror the actual render pipeline instead of vague waiting states.",
      "The render route was reworked to avoid brittle file URL handling.",
    ],
  },
  {
    id: "2026-04-22-foundations",
    date: "2026-04-22",
    eyebrow: "Studio foundations",
    title: "The editing surface became more deliberate, responsive, and easier to trust.",
    summary:
      "A quieter shell, safer theme handling, better aspect controls, and direct preview interactions make the product feel more like a crafted studio and less like a stitched-together demo.",
    highlights: [
      "Theme and hydration fixes made the chrome more stable.",
      "Aspect presets and safe-zone overlays keep captions out of platform UI.",
      "Preview interactions now support direct positioning instead of settings-only placement.",
    ],
  },
];

export const changelogFeatureCount = changelogFeatureGroups.reduce(
  (total, group) => total + group.items.length,
  0,
);

export const whatsNewBanner = {
  eyebrow: "New in MeowCap",
  title: `${CAPTION_STYLES.length} styles, ${LANGUAGES.length} languages, and real exports.`,
  description:
    "Import subtitles, scrub a waveform, save brand kits, and render MP4 or WebM without leaving the studio.",
  cta: "Open changelog",
};
