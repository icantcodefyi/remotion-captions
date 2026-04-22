export type FeatureHighlight = {
  title: string;
  description: string;
};

export type UseCase = {
  title: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const homeFeatureHighlights: FeatureHighlight[] = [
  {
    title: "Word-level timing with script alignment",
    description:
      "Upload a clip, let MeowCap transcribe it with Deepgram, and optionally snap your exact script onto the detected timings for cleaner captions.",
  },
  {
    title: "Animated styles made for social video",
    description:
      "Preview punchy caption treatments for TikTok, Reels, Shorts, podcasts, product clips, and creator content without leaving the browser.",
  },
  {
    title: "Editable captions before export",
    description:
      "Tweak captions, style settings, position, and pacing before exporting subtitle files your editor or motion workflow can reuse downstream.",
  },
  {
    title: "Fast browser workflow for small teams",
    description:
      "MeowCap is built for creators, agencies, and marketing teams that need caption-ready deliverables without opening a heavyweight NLE for every clip.",
  },
];

export const homeUseCases: UseCase[] = [
  {
    title: "TikTok, Reels, and Shorts captions",
    description:
      "Turn vertical clips into watchable social posts with animated captions that make hooks land quickly on mute-first feeds.",
  },
  {
    title: "Podcast and interview snippets",
    description:
      "Keep speaker intent intact by aligning polished captions to dialogue-heavy clips, sound bites, and talking-head edits.",
  },
  {
    title: "Product demos and launch videos",
    description:
      "Make feature walkthroughs easier to follow with readable captions, branded styles, and subtitle exports your team can ship fast.",
  },
  {
    title: "Internal training and async explainers",
    description:
      "Help distributed teams absorb walkthroughs and announcements with accurate captions that are simple to edit and reuse.",
  },
];

export const homeFaqs: FaqItem[] = [
  {
    question: "What kind of videos can I caption with MeowCap?",
    answer:
      "MeowCap is designed for short-form marketing clips, creator videos, product demos, podcast snippets, and internal explainers. If the file can be uploaded and transcribed, you can style and export captions from it.",
  },
  {
    question: "Can I use my own script instead of raw transcription?",
    answer:
      "Yes. Paste a script and MeowCap aligns your exact words to the detected audio timings so the final captions read the way you wrote them.",
  },
  {
    question: "Does MeowCap export subtitle files?",
    answer:
      "Yes. The editor supports exporting captions as SRT and JSON, which makes it easy to hand the result to editors, motion designers, or downstream automation.",
  },
  {
    question: "Why use MeowCap instead of captioning inside an editor?",
    answer:
      "MeowCap shortens the workflow for teams that need fast caption drafts, social-ready styling, and reusable subtitle exports without opening a full video editing timeline for every clip.",
  },
];
