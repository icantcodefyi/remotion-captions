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

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedTime: string;
  updatedTime: string;
  readingTime: string;
  keywords: string[];
  sections: BlogSection[];
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

export const blogPosts: BlogPost[] = [
  {
    slug: "animated-captions-for-short-form-video",
    title: "How to Add Animated Captions to Short-Form Video Without Slowing Down Your Edit",
    description:
      "A practical workflow for generating animated captions for TikTok, Reels, Shorts, podcast clips, and product videos without a heavyweight editing pass.",
    excerpt:
      "A lean caption workflow that keeps speed, readability, and brand polish intact across short-form video formats.",
    publishedTime: "2026-04-22",
    updatedTime: "2026-04-22",
    readingTime: "8 min read",
    keywords: [
      "animated captions for short-form video",
      "TikTok caption generator",
      "Instagram Reels subtitles",
      "YouTube Shorts captions",
    ],
    sections: [
      {
        heading: "Why animated captions matter now",
        paragraphs: [
          "Short-form video is watched in noisy environments, in transit, and in the gaps between other tasks. That means the first seconds of comprehension matter almost as much as the first seconds of visual hook. Animated captions help creators and teams keep a viewer oriented before audio becomes the main driver.",
          "The problem is that a lot of caption workflows still live inside long editing timelines. That can be fine for a single flagship video, but it becomes expensive when your team needs ten variants, social cuts, and last-minute copy changes. Caption generation works best when it becomes a fast iteration loop instead of a finishing chore.",
        ],
      },
      {
        heading: "Build the workflow around timing first",
        paragraphs: [
          "The most reliable caption workflows start with timing. If you transcribe accurately at the word level, you can swap styling, pacing, and exports later without destroying the underlying structure. That matters when a clip moves from a rough creator cut to a polished paid-social version.",
          "A timing-first workflow also makes script alignment practical. Many teams know the final words they want on screen, but the delivered voiceover does not always match the written script exactly. Aligning the script to the audio lets you preserve editorial intent while still landing captions in the right place.",
        ],
        bullets: [
          "Generate word-level transcript timing before making visual decisions.",
          "Use script alignment when the approved copy differs from the spoken take.",
          "Keep exports reusable so the same caption timing can feed multiple versions.",
        ],
      },
      {
        heading: "Choose styles by context, not by novelty",
        paragraphs: [
          "The best animated caption style is not always the loudest one. Fast-cut creator content often benefits from punchy word emphasis, but customer stories, product walkthroughs, and internal explainers usually need a calmer treatment that stays readable over longer stretches.",
          "Teams often lose time when every clip starts from scratch. A better approach is to define a small set of caption looks by use case: one style for social hooks, one for polished brand content, one for dense educational clips, and one for talking-head explainers.",
        ],
      },
      {
        heading: "Keep the edit loop fast",
        paragraphs: [
          "Caption tools should reduce edit pressure, not create more of it. When caption changes require reopening a heavy timeline or manually fixing every word, small revisions become bottlenecks. Browser-based preview, editable transcripts, and direct subtitle export keep the loop short enough for real production work.",
          "That speed matters most when the asset count rises. Agencies, creator teams, and in-house marketers often need one transcript source to feed vertical cutdowns, A/B openings, and partner-safe versions. The more often you can reuse timing data, the cheaper each new asset becomes.",
        ],
      },
      {
        heading: "What a good short-form caption stack should include",
        paragraphs: [
          "If you are evaluating caption tools, focus on the boring parts as much as the shiny ones. Accurate timing, editable captions, flexible style controls, and reusable exports are the pieces that keep a workflow stable when deadlines tighten.",
          "Animated captions absolutely help engagement, but the real operational win is consistency. When your team can move from raw clip to subtitle export in minutes, captioning becomes part of the production system rather than a fire drill at the end.",
        ],
        bullets: [
          "Word-level timing and transcript editing",
          "Script alignment for approved marketing copy",
          "Style presets for distinct channels or campaigns",
          "Exports that work in other editors and motion pipelines",
        ],
      },
    ],
  },
  {
    slug: "transcript-vs-subtitles-vs-closed-captions",
    title: "Transcript vs Subtitles vs Closed Captions: What Video Teams Actually Need",
    description:
      "Understand the difference between transcripts, subtitles, and closed captions so your team can pick the right output for marketing, accessibility, and editing workflows.",
    excerpt:
      "A practical breakdown of transcript, subtitle, and closed-caption workflows for modern video teams.",
    publishedTime: "2026-04-22",
    updatedTime: "2026-04-22",
    readingTime: "7 min read",
    keywords: [
      "transcript vs subtitles",
      "closed captions vs subtitles",
      "subtitle workflow",
      "video accessibility captions",
    ],
    sections: [
      {
        heading: "Why teams mix these terms up",
        paragraphs: [
          "In everyday production work, transcript, subtitle, and caption are often used interchangeably. That is understandable because all three involve text derived from audio. The confusion starts causing problems when teams export the wrong file format, skip accessibility details, or assume one output can serve every channel.",
          "A transcript is usually the raw text record of what was said. Subtitles are timed text meant to mirror spoken dialogue. Closed captions usually go further by capturing non-speech audio cues such as music, laughter, or speaker changes for accessibility contexts.",
        ],
      },
      {
        heading: "Where transcripts help most",
        paragraphs: [
          "Transcripts are useful earlier in the workflow than many teams realize. They support copy review, searchability, highlight selection, approvals, and repurposing. A clean transcript can also become the base layer for captions, blog content, and internal documentation.",
          "For content teams, transcripts are often the bridge between video production and written distribution. They help turn one recorded asset into social cutdowns, newsletter snippets, articles, help-center content, and campaign messaging.",
        ],
      },
      {
        heading: "What subtitles are optimized for",
        paragraphs: [
          "Subtitles are built for viewing comprehension. Their job is to land readable text on screen at the right time, with enough pacing and segmentation for the viewer to keep up. That makes timing accuracy and line breaking much more important than they are in plain transcripts.",
          "This is where style enters the equation. Subtitles on short-form video are not only functional. They also shape emphasis, rhythm, and brand feel. Good subtitle tools let teams balance readability with motion and expression rather than forcing one generic look everywhere.",
        ],
      },
      {
        heading: "When closed captions are the better choice",
        paragraphs: [
          "Closed captions matter when accessibility is part of the requirement, not an afterthought. If the audience needs music cues, speaker identification, or context that is not fully contained in dialogue, subtitles alone are not enough.",
          "Even when teams publish stylized open captions on social, it is still useful to understand where a more formal accessibility-oriented closed caption workflow should exist elsewhere in the stack.",
        ],
        bullets: [
          "Use transcripts for review, search, repurposing, and source material.",
          "Use subtitles for timed on-screen reading and social/video distribution.",
          "Use closed captions when non-dialogue audio context must be preserved.",
        ],
      },
      {
        heading: "Choosing the right deliverable",
        paragraphs: [
          "Most modern teams do not need to choose only one output. The stronger approach is to build a pipeline where transcription creates the source text, caption editing cleans up the phrasing, and exports support whichever downstream format the channel needs.",
          "That is why reusable caption tools matter. When you can keep transcript text, timing data, and subtitle exports connected, your team can move faster without losing accessibility or brand quality.",
        ],
      },
    ],
  },
  {
    slug: "brand-consistent-caption-styles",
    title: "How to Keep Caption Styles Consistent Across Creators, Clients, and Campaigns",
    description:
      "A framework for keeping caption styles brand-safe across creator teams, agencies, and in-house social workflows.",
    excerpt:
      "Consistency in captions comes from clear style systems, not one-off edits on every video.",
    publishedTime: "2026-04-22",
    updatedTime: "2026-04-22",
    readingTime: "6 min read",
    keywords: [
      "brand consistent captions",
      "caption style system",
      "social video brand guidelines",
      "agency caption workflow",
    ],
    sections: [
      {
        heading: "Why caption consistency breaks down",
        paragraphs: [
          "Caption styling often starts as a design decision and ends as an operations problem. A freelancer chooses one look, a paid-social editor chooses another, and the internal team adjusts colors manually under deadline. The result is a feed that feels assembled instead of designed.",
          "This tends to happen when teams rely on taste instead of a system. Caption style consistency is easier when the organization decides what each style is for before the asset count grows.",
        ],
      },
      {
        heading: "Define style by channel role",
        paragraphs: [
          "Different channels ask captions to do different jobs. Hook-heavy social clips need visual energy quickly. Product explainers need calmer pacing. Interview clips need readability over long spoken passages. Brand consistency improves when each of these jobs has an approved starting style.",
          "That does not mean every caption should look identical. It means each approved style should feel related through type, color logic, pacing, and emphasis rules.",
        ],
      },
      {
        heading: "Create a small style library",
        paragraphs: [
          "Most teams do better with three to five approved caption patterns than with endless freedom. Too many options create friction and off-brand drift. A smaller library gives editors enough flexibility while keeping reviews fast.",
          "Look for tools that let you control font scale, position, emphasis color, word density, and export behavior without requiring the entire composition to be rebuilt every time.",
        ],
        bullets: [
          "One style for social hooks and punchy cutdowns",
          "One style for polished demos and brand videos",
          "One style for dialogue-heavy educational clips",
          "Optional campaign-specific accent adjustments when needed",
        ],
      },
      {
        heading: "Turn style consistency into review consistency",
        paragraphs: [
          "A good caption system reduces review load. Stakeholders stop debating every clip from zero because the creative constraints are already agreed upon. That frees feedback to focus on copy clarity, timing, and business intent instead of low-level visual drift.",
          "Consistency is also a trust signal. When captions feel coherent across creators and campaigns, viewers experience the brand as more deliberate and polished.",
        ],
      },
      {
        heading: "Operationalize it with reusable exports",
        paragraphs: [
          "The final step is portability. If captions can be exported cleanly and reused downstream, the style system becomes easier to preserve across teams and tools. The organization is no longer tied to one editor's timeline or one person's manual process.",
          "That is the real value of a caption workflow platform: not just pretty text on video, but repeatable quality under real production pressure.",
        ],
      },
    ],
  },
  {
    slug: "podcast-clips-to-social-captions",
    title: "From Podcast Clip to Social Caption: A Repeatable Workflow for Fast Repurposing",
    description:
      "Learn how to turn long-form interviews and podcasts into social-ready captioned clips with less manual cleanup and faster review cycles.",
    excerpt:
      "A repurposing workflow for podcast teams that need readable, social-first captions without constant manual rework.",
    publishedTime: "2026-04-22",
    updatedTime: "2026-04-22",
    readingTime: "7 min read",
    keywords: [
      "podcast clip captions",
      "podcast to social workflow",
      "captioned podcast clips",
      "short-form repurposing",
    ],
    sections: [
      {
        heading: "Why podcast clips are harder than they look",
        paragraphs: [
          "Podcast teams usually have plenty of words and not enough time. Long-form conversations create great raw material for social distribution, but dialogue-heavy clips expose every weakness in a caption workflow. Bad timing, cluttered line breaks, and inconsistent emphasis immediately make clips feel cheap.",
          "That is why podcast repurposing works best when captions are treated as an editorial layer, not just a transcription artifact. The words on screen need to guide attention, not just mirror every syllable with perfect literalism.",
        ],
      },
      {
        heading: "Start with a strong transcript source",
        paragraphs: [
          "Repurposing gets easier when the transcript is reliable from the beginning. Word-level timing gives editors flexibility to trim a clip, keep only the strongest lines, and still maintain subtitle sync when the hook changes late in the process.",
          "It also helps to keep transcript cleanup close to the caption tool. When corrections happen in a separate document, timing and copy can drift apart quickly.",
        ],
      },
      {
        heading: "Use captions to shape retention",
        paragraphs: [
          "On social platforms, captions are part of the pacing. They can create emphasis, clarify jargon, and prevent viewers from dropping when the spoken cadence slows down. The strongest clips usually balance accuracy with readability rather than trying to display too many words at once.",
          "A good editing rule is to optimize for the next glance. Each caption block should help the viewer understand what matters immediately, especially in the opening seconds.",
        ],
        bullets: [
          "Keep word groups readable rather than stuffing the full sentence on screen.",
          "Use style emphasis to reinforce the core hook or emotional turn.",
          "Edit transcript wording when needed, but preserve speaker intent.",
        ],
      },
      {
        heading: "Speed up approvals with reusable exports",
        paragraphs: [
          "Podcast teams often publish at volume, which makes speed non-negotiable. Reusable caption exports let editors, marketers, and motion designers collaborate without rebuilding the same text treatment repeatedly.",
          "Once that system is in place, repurposing stops feeling like a weekly scramble. The team can focus on finding the right moments instead of redoing caption plumbing every time.",
        ],
      },
      {
        heading: "What to standardize first",
        paragraphs: [
          "If you want a cleaner podcast-to-social workflow, standardize caption timing, a small set of style presets, and your export handoff. Those three pieces eliminate a surprising amount of friction.",
          "From there, every new episode becomes easier to package for discovery across Shorts, Reels, TikTok, and owned channels.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
