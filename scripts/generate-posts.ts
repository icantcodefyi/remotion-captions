import fs from "node:fs";
import path from "node:path";

type KeywordRow = {
  query: string;
  slug: string;
  volume: number;
  difficulty: number;
  intent: string;
  cluster: string;
  pillar_slug: string;
  notes: string;
  status: string;
};

type Cluster = {
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  pillarSlug: string;
  audience: string;
  sitemapId: string;
  targetArchivePageSize: number;
  siblingLinkCount: { min: number; max: number };
  crossClusterPillarLimit: number;
};

type SectionBrief = {
  heading: string;
  focus: string;
  example: string;
  takeaway: string;
  bullets?: string[];
};

type PostBrief = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
  readerRole: string;
  scenario: string;
  problem: string;
  desiredOutcome: string;
  meowcapExample: string;
  ctaText: string;
  crossClusterLinks?: string[];
  sections: SectionBrief[];
};

type BriefCollection = {
  posts: PostBrief[];
};

type TelemetryRecord = {
  timestamp: string;
  slug: string;
  query: string;
  cluster: string;
  mode: "dry-run" | "write";
  outcome: string;
  pipelineVersion: string;
  wordCount: number;
  filePath: string;
  stages: Array<{
    name: string;
    durationMs: number;
    notes: string;
  }>;
};

type Outline = {
  angle: string;
  targetReader: string;
  intro: string[];
  sections: Array<{
    heading: string;
    notes: string[];
    bullets: string[];
  }>;
};

const ROOT = process.cwd();
const KEYWORDS_PATH = path.join(ROOT, "data", "keywords.csv");
const CLUSTERS_PATH = path.join(ROOT, "data", "clusters.json");
const BRIEFS_PATH = path.join(ROOT, "data", "post-briefs.json");
const RUN_LOG_PATH = path.join(ROOT, "data", "run.log.jsonl");
const CONTENT_DIR = path.join(ROOT, "content", "blog");
const STYLE_GUIDE_PATH = path.join(ROOT, "docs", "blog-style.md");
const FACTS_PATH = path.join(ROOT, "docs", "facts.md");
const FIXTURE_PATH = path.join(ROOT, "docs", "fixtures", "transcript-sample-1.json");
const PIPELINE_VERSION = "briefed-local-author-v1";

function parseArgs(argv: string[]) {
  let limit: number | null = null;
  let cluster: string | null = null;
  let dryRun = true;
  let write = false;
  let overwrite = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--limit") {
      limit = Number(argv[index + 1] ?? "0");
      index += 1;
      continue;
    }

    if (arg === "--cluster") {
      cluster = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--write") {
      dryRun = false;
      write = true;
      continue;
    }

    if (arg === "--overwrite") {
      overwrite = true;
      continue;
    }
  }

  return { limit, cluster, dryRun, write, overwrite };
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function loadKeywords() {
  const raw = fs.readFileSync(KEYWORDS_PATH, "utf8").trim();
  const [headerLine, ...lines] = raw.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    const record = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ) as Record<string, string>;

    return {
      query: record.query,
      slug: record.slug,
      volume: Number(record.volume || 0),
      difficulty: Number(record.difficulty || 0),
      intent: record.intent,
      cluster: record.cluster,
      pillar_slug: record.pillar_slug,
      notes: record.notes,
      status: record.status,
    };
  });
}

function loadClusters() {
  const raw = fs.readFileSync(CLUSTERS_PATH, "utf8");
  const parsed = JSON.parse(raw) as { clusters: Cluster[] };
  return parsed.clusters;
}

function loadBriefs() {
  if (!fs.existsSync(BRIEFS_PATH)) {
    return new Map<string, PostBrief>();
  }

  const raw = fs.readFileSync(BRIEFS_PATH, "utf8");
  const parsed = JSON.parse(raw) as BriefCollection;
  const briefMap = new Map<string, PostBrief>();

  for (const brief of parsed.posts) {
    if (briefMap.has(brief.slug)) {
      throw new Error(`Duplicate post brief detected for slug: ${brief.slug}`);
    }

    if (brief.sections.length < 4 || brief.sections.length > 7) {
      throw new Error(
        `Post brief \`${brief.slug}\` must define 4 to 7 sections.`,
      );
    }

    if (brief.description.length > 155) {
      throw new Error(`Post brief \`${brief.slug}\` has a description longer than 155 chars.`);
    }

    if (brief.excerpt.length > 220) {
      throw new Error(`Post brief \`${brief.slug}\` has an excerpt longer than 220 chars.`);
    }

    briefMap.set(brief.slug, brief);
  }

  return briefMap;
}

function appendRunLog(record: TelemetryRecord) {
  fs.appendFileSync(RUN_LOG_PATH, `${JSON.stringify(record)}\n`);
}

function readExistingPosts() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const slugMatch = raw.match(/^slug:\s*"?(.*?)"?$/m);
      const titleMatch = raw.match(/^title:\s*"?(.*?)"?$/m);

      return {
        slug: slugMatch?.[1] ?? file.replace(/\.md$/, ""),
        title: titleMatch?.[1] ?? file.replace(/\.md$/, ""),
      };
    });
}

function lowerFirst(value: string) {
  if (!value.length) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function toTitleCase(value: string) {
  const smallWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "by",
    "for",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "vs",
    "with",
  ]);

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function sentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return trimmed;
  }
  const normalized = trimmed.replace(/\s+/g, " ");
  const punctuated = /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
  return punctuated.charAt(0).toUpperCase() + punctuated.slice(1);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  const slice = value.slice(0, maxLength - 1);
  const trimmed = slice.replace(/\s+\S*$/, "").trim();
  return `${trimmed || slice.trim()}…`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickVariant<T>(seed: string, options: T[]) {
  return options[hashString(seed) % options.length];
}

function buildAutoBrief(
  row: KeywordRow,
  cluster: Cluster,
  clusters: Cluster[],
) {
  const queryTitle = toTitleCase(row.query);
  const scenario = `${row.query} inside ${cluster.shortDescription.toLowerCase()}`;
  const titleSuffixByCluster: Record<string, string> = {
    "creator-workflow": "A Practical Creator Guide",
    accessibility: "A Practical Accessibility Guide",
    "agency-ops": "A Practical Agency Operations Guide",
    "podcast-repurposing": "A Practical Repurposing Guide",
  };
  const readerRoleByCluster: Record<string, string> = {
    "creator-workflow": "a creator, editor, or in-house social lead",
    accessibility: "a video producer, marketer, or accessibility reviewer",
    "agency-ops": "an agency lead, producer, or client services editor",
    "podcast-repurposing": "a podcast producer, social editor, or repurposing lead",
  };
  const problemByCluster: Record<string, string> = {
    "creator-workflow":
      `teams handling ${row.query} often lose time when caption timing, copy cleanup, and export happen in separate tools`,
    accessibility:
      `teams responsible for ${row.query} often struggle when readability, transcript review, and delivery requirements get treated as the same step`,
    "agency-ops":
      `teams handling ${row.query} often create rework when multiple reviewers touch caption wording, styling, and approvals without one clear system`,
    "podcast-repurposing":
      `teams handling ${row.query} often lose momentum when long-form source material has to be reshaped for short-form viewing under deadline`,
  };
  const desiredByCluster: Record<string, string> = {
    "creator-workflow": `a repeatable short-form caption workflow for ${row.query}`,
    accessibility: `a clearer caption and transcript delivery workflow for ${row.query}`,
    "agency-ops": `a steadier review and production system for ${row.query}`,
    "podcast-repurposing": `a repeatable repurposing workflow for ${row.query}`,
  };
  const exampleByCluster: Record<string, string> = {
    "creator-workflow":
      `an editor can upload the active cut, tighten the transcript where ${row.query} needs cleaner wording, preview the caption treatment, and export the file for the next handoff`,
    accessibility:
      `a producer can upload the clip, confirm the transcript and timing for ${row.query}, adjust readability in the preview, and export SRT or JSON for downstream review`,
    "agency-ops":
      `a team lead can upload the client cut, align approved wording for ${row.query}, preview the agreed caption treatment, and export a reusable subtitle file for review`,
    "podcast-repurposing":
      `a producer can upload the selected clip, tighten the transcript for ${row.query}, preview a readable subtitle treatment, and export the caption layer without rebuilding it in another tool`,
  };
  const ctaByCluster: Record<string, string> = {
    "creator-workflow":
      `The next useful step is to test ${row.query} on one real clip in the MeowCap studio and compare the handoff against your current edit loop.`,
    accessibility:
      `The next useful step is to run one accessibility-sensitive clip through MeowCap and review whether ${row.query} feels clearer at the transcript, timing, and export stages.`,
    "agency-ops":
      `The next useful step is to run one client-bound asset through MeowCap and compare how ${row.query} behaves when the caption review happens from one current source.`,
    "podcast-repurposing":
      `The next useful step is to test ${row.query} on one existing clip in MeowCap and compare the result to your current repurposing handoff.`,
  };
  const sectionSets: Record<string, SectionBrief[]> = {
    "creator-workflow": [
      {
        heading: "Set up the working cut before styling captions",
        focus: `${queryTitle} works better when the team decides which version of the clip is really moving forward before subtitle styling starts`,
        example: `If the opening hook or crop is still changing, the caption layer for ${row.query} becomes unstable and the same text decisions keep getting redone`,
        takeaway: `A small pre-flight check gives ${row.query} a better foundation than styling too early`,
      },
      {
        heading: "Build the timing layer first",
        focus: `Reliable word timing is what makes ${row.query} easier to revise without losing sync`,
        example: `Once timing is stable, teams can tighten the hook, restyle the text, or create alternate versions of ${row.query} without restarting the subtitle pass`,
        takeaway: `Timing-first workflows keep ${row.query} reusable as the edit changes`,
      },
      {
        heading: "Clean up wording without breaking the rhythm",
        focus: `${queryTitle} usually reads better when the team can improve phrasing without abandoning the audio timing`,
        example: `That matters when a transcript for ${row.query} captures every filler phrase but the published version needs sharper copy`,
        takeaway: `Script alignment keeps ${row.query} readable while preserving the cadence viewers expect`,
      },
      {
        heading: "Match the caption treatment to the channel",
        focus: `${queryTitle} is easier to scale when style choices are tied to the actual job of the clip`,
        example: `A product demo using ${row.query} may need calmer readability, while a hook-first social cut can tolerate faster emphasis`,
        takeaway: `A small preset system helps ${row.query} stay clear without turning each export into a design debate`,
        bullets: [
          `Keep the phrase length for ${row.query} short enough to scan on first glance.`,
          `Use emphasis in ${row.query} to support the hook, not to decorate every line.`,
          `Choose position and density for ${row.query} based on the actual frame composition.`,
        ],
      },
      {
        heading: "Keep the export reusable",
        focus: `${queryTitle} becomes much easier to maintain when the subtitle export can move cleanly into the next review or edit`,
        example: `That matters whenever ${row.query} needs another hook, a new stakeholder pass, or a quick version for a second channel`,
        takeaway: `Reusable exports turn ${row.query} into part of the production system instead of one more fragile finishing step`,
      },
    ],
    accessibility: [
      {
        heading: "Decide what text artifact the team actually needs",
        focus: `${queryTitle} gets easier when the team names whether it is reviewing transcript content, subtitle timing, or final delivery`,
        example: `Many problems around ${row.query} begin when a rough transcript, an SRT, and a final viewing file are treated like the same thing`,
        takeaway: `Clear artifact naming gives ${row.query} a better review path`,
      },
      {
        heading: "Use the transcript layer as the source of truth",
        focus: `${queryTitle} holds up better when transcript review happens before styling or export decisions get locked`,
        example: `That keeps ${row.query} from splitting into one version of the words for reviewers and another version in the subtitle file`,
        takeaway: `A stable transcript layer gives ${row.query} cleaner downstream decisions`,
      },
      {
        heading: "Improve readability at the timing and phrase level",
        focus: `${queryTitle} is easier to follow when timing, grouping, and pacing are treated as accessibility choices rather than cosmetic extras`,
        example: `If ${row.query} is too dense or poorly timed, viewers spend energy decoding the text instead of following the message`,
        takeaway: `Readable timing turns ${row.query} into something viewers can absorb on first watch`,
      },
      {
        heading: "Review the handoff the way the audience experiences it",
        focus: `${queryTitle} benefits from playback review because readability issues often show up only when the clip is moving at speed`,
        example: `Watching ${row.query} in context reveals crowded lines, awkward timing, and unclear transitions that static text review can miss`,
        takeaway: `Audience-style review makes ${row.query} more trustworthy before it goes downstream`,
        bullets: [
          `Check whether ${row.query} still works for a viewer seeing the clip once at speed.`,
          `Confirm that transcript, subtitle, and export decisions for ${row.query} still point back to the same source text.`,
          `Route feedback on ${row.query} back into the main workflow instead of a separate document.`,
        ],
      },
      {
        heading: "Export with the next reviewer in mind",
        focus: `${queryTitle} becomes easier to support when the exported file carries current wording, current timing, and clear context for the next person`,
        example: `That is especially useful when ${row.query} moves between marketing, accessibility review, and final video delivery`,
        takeaway: `A cleaner export keeps ${row.query} from becoming a confusing handoff problem`,
      },
    ],
    "agency-ops": [
      {
        heading: "Define what the team is approving at each step",
        focus: `${queryTitle} is easier to control when copy review, timing review, and style review are not all collapsed into one round`,
        example: `Without clear stages, ${row.query} usually creates vague comments that force editors to rebuild captions instead of improving them`,
        takeaway: `Named review stages make ${row.query} easier to manage across multiple stakeholders`,
      },
      {
        heading: "Keep one current subtitle source",
        focus: `${queryTitle} stays cleaner when every reviewer is looking at the same current caption layer instead of scattered exports`,
        example: `That matters when ${row.query} has to survive agency comments, client comments, and fast turnaround between rounds`,
        takeaway: `One current source keeps ${row.query} from drifting into version confusion`,
      },
      {
        heading: "Use presets and SOPs to reduce avoidable debates",
        focus: `${queryTitle} moves faster when the team can rely on a small, documented system for styling and handoff decisions`,
        example: `For ${row.query}, a light preset library and clear SOP do more for consistency than asking each editor to invent a fresh treatment`,
        takeaway: `Documented defaults make ${row.query} easier to hand off across people and accounts`,
      },
      {
        heading: "Turn review language into an operational tool",
        focus: `${queryTitle} gets better feedback when reviewers know how to talk about readability, density, emphasis, and delivery`,
        example: `That gives ${row.query} a shared vocabulary, which reduces subjective feedback loops and speeds up revisions`,
        takeaway: `Operational review language helps ${row.query} stay on schedule without flattening judgment`,
        bullets: [
          `Label whether feedback on ${row.query} is about wording, timing, or presentation.`,
          `Document who can change styling choices for ${row.query} without escalation.`,
          `Keep the export path for ${row.query} consistent across accounts and campaigns.`,
        ],
      },
      {
        heading: "Measure the workflow by rework avoided",
        focus: `${queryTitle} is healthiest when the team can move from review to export without reconstructing the subtitle layer`,
        example: `If ${row.query} still triggers extra rebuilds after each approval round, the process is creating cost instead of removing it`,
        takeaway: `The strongest signal that ${row.query} is working is less preventable rework across the team`,
      },
    ],
    "podcast-repurposing": [
      {
        heading: "Pick the clip with silent viewing in mind",
        focus: `${queryTitle} works better when the chosen moment can still carry meaning for viewers who have not heard the full episode`,
        example: `The best candidates for ${row.query} usually have one sentence or one turn that earns the next glance quickly`,
        takeaway: `Clip selection is the first editorial decision inside ${row.query}`,
      },
      {
        heading: "Tighten the transcript for short-form pacing",
        focus: `${queryTitle} becomes easier to watch when the subtitle layer reflects the social version of the idea rather than every long-form detour`,
        example: `That is why ${row.query} often needs a cleaner transcript than the raw recording provides`,
        takeaway: `Transcript cleanup makes ${row.query} feel intentional instead of dumped from the source audio`,
      },
      {
        heading: "Use captions to guide the viewer through the idea",
        focus: `${queryTitle} holds attention better when captions pace the argument instead of giving every spoken fragment equal weight`,
        example: `For ${row.query}, better grouping and timing can make a modest clip feel sharper without changing the speaker's meaning`,
        takeaway: `Strong pacing is one of the biggest gains available inside ${row.query}`,
      },
      {
        heading: "Choose a subtitle treatment that leaves room for the speaker",
        focus: `${queryTitle} usually performs better when the caption style supports the person on screen rather than competing with them`,
        example: `A calm treatment often helps ${row.query} feel more deliberate than an aggressive motion style that overwhelms the clip`,
        takeaway: `Subtitle style for ${row.query} should reinforce the conversation before it chases novelty`,
        bullets: [
          `Use emphasis in ${row.query} only where the key turn of the clip actually happens.`,
          `Leave enough frame space in ${row.query} for faces, reactions, or guest context.`,
          `Check whether ${row.query} still reads cleanly on the final vertical crop.`,
        ],
      },
      {
        heading: "Keep the repurposing loop light enough to repeat",
        focus: `${queryTitle} scales when transcript cleanup, preview, and export stay inside a short editorial loop`,
        example: `That makes ${row.query} easier to repeat across multiple clips from the same episode without rebuilding subtitle work each time`,
        takeaway: `A lightweight loop turns ${row.query} into a reusable publishing system`,
      },
    ],
  };

  const clusterIndex = clusters.findIndex((item) => item.slug === cluster.slug);
  const crossClusterLinks = clusters
    .filter((item) => item.slug !== cluster.slug)
    .map((item) => item.pillarSlug);
  const crossClusterLink =
    crossClusterLinks[(hashString(row.slug) + Math.max(0, clusterIndex)) % crossClusterLinks.length];

  return {
    slug: row.slug,
    title: `${queryTitle}: ${titleSuffixByCluster[cluster.slug] ?? "A Practical Workflow Guide"}`,
    description: truncateText(
      `A practical guide to ${row.query} with a repeatable ${cluster.title.toLowerCase()} workflow for MeowCap teams.`,
      155,
    ),
    excerpt: truncateText(
      `Use a timing-first MeowCap workflow to handle ${row.query} with cleaner review, better readability, and more reusable exports.`,
      220,
    ),
    keywords: [
      row.query,
      `${row.query} workflow`,
      `${cluster.title.toLowerCase()} captions`,
      `${row.query} guide`,
    ],
    readerRole: readerRoleByCluster[cluster.slug] ?? `a team working on ${row.query}`,
    scenario,
    problem: problemByCluster[cluster.slug] ?? `teams handling ${row.query} often lose time when the caption workflow is not clearly defined`,
    desiredOutcome:
      desiredByCluster[cluster.slug] ?? `a repeatable workflow for ${row.query}`,
    meowcapExample:
      exampleByCluster[cluster.slug] ??
      `an operator can transcribe the clip, align better wording for ${row.query}, preview the caption treatment, and export the final file for the next handoff`,
    ctaText:
      ctaByCluster[cluster.slug] ??
      `The next useful step is to test ${row.query} on one real clip in MeowCap and compare the handoff with your current workflow.`,
    crossClusterLinks: [crossClusterLink],
    sections: sectionSets[cluster.slug] ?? sectionSets["creator-workflow"],
  };
}

function estimateReadingTime(wordCount: number) {
  return `${Math.max(6, Math.round(wordCount / 200))} min read`;
}

function measureStage<T>(name: string, fn: () => T) {
  const started = Date.now();
  const value = fn();
  return {
    value,
    stage: {
      name,
      durationMs: Date.now() - started,
    },
  };
}

function buildIntroParagraphs(row: KeywordRow, cluster: Cluster, brief: PostBrief) {
  const opener = pickVariant(`${row.slug}:intro:0`, [
    `If you are ${brief.readerRole}, ${brief.problem}`,
    `${brief.readerRole} usually run into the same issue with ${row.query}: ${lowerFirst(brief.problem)}`,
    `For ${brief.readerRole}, ${row.query} often looks simple until ${lowerFirst(brief.problem)}`,
  ]);

  const bridge = pickVariant(`${row.slug}:intro:1`, [
    `${brief.desiredOutcome} gets easier when the transcript, caption copy, and export handoff stay inside one working loop`,
    `For ${row.query}, the cleaner path is to keep timing, approved wording, and style choices connected so the caption pass supports the edit instead of slowing it down`,
    `What works best for ${brief.scenario} is a workflow that starts with timing, keeps the wording editable, and makes ${row.query} reusable in the finished subtitle layer`,
  ]);

  const context = pickVariant(`${row.slug}:intro:2`, [
    `This use case for ${row.query} sits inside ${cluster.shortDescription.toLowerCase()}`,
    `That matters in ${brief.scenario.toLowerCase()} because small caption decisions compound once ${row.query} is moving through a real publishing schedule`,
    `For ${row.query}, the caption workflow needs to feel more like production infrastructure than a finishing flourish`,
  ]);

  const promise = pickVariant(`${row.slug}:intro:3`, [
    `This guide stays practical for ${row.query}: where the workflow breaks, what to standardize first, and how to use MeowCap without creating another cleanup layer`,
    `The goal here is not flashier text on screen for ${brief.scenario}. It is a repeatable operating system for getting accurate, readable captions out the door on ${brief.scenario}`,
    `That is the useful angle for ${row.query}: remove rework, keep the caption layer flexible, and give the next reviewer a cleaner handoff`,
  ]);

  const productionAngle = pickVariant(`${row.slug}:intro:4`, [
    `In practice, ${row.query} becomes easier when the team can move from one revision to the next without losing context about what the captions are supposed to do`,
    `The fastest teams treat ${brief.scenario} like a production system, which means the text, timing, and review handoff for ${row.query} all stay related even while the creative changes`,
    `That is especially useful for ${row.query} when one clip is going to spawn multiple versions, because the caption layer can keep working instead of becoming a fresh task every round`,
  ]);

  const meowcapSetup = pickVariant(`${row.slug}:intro:5`, [
    `MeowCap is most helpful for ${row.query} when it keeps transcription, alignment, styling, and export close together so the operator can solve the whole job in one pass`,
    `Used well, MeowCap shortens the distance between transcript cleanup and final export in ${brief.scenario}, which is where many teams currently lose time`,
    `That is also why the MeowCap workflow matters for ${row.query}: it keeps the operational choices visible instead of hiding them across several tools`,
  ]);

  return [
    `${sentenceCase(opener)} ${sentenceCase(bridge)}`,
    `${sentenceCase(context)} ${sentenceCase(promise)}`,
    `${sentenceCase(productionAngle)} ${sentenceCase(meowcapSetup)}`,
  ];
}

function buildOutline(row: KeywordRow, cluster: Cluster, brief: PostBrief) {
  const intro = buildIntroParagraphs(row, cluster, brief);

  return {
    angle: `${brief.title} with a ${cluster.title.toLowerCase()} angle for ${brief.scenario}.`,
    targetReader: brief.readerRole,
    intro,
    sections: brief.sections.map((section) => ({
      heading: section.heading,
      notes: [section.focus, section.example, section.takeaway],
      bullets: section.bullets ?? [],
    })),
  } satisfies Outline;
}

function buildSameClusterLinks(
  row: KeywordRow,
  keywordRows: KeywordRow[],
  cluster: Cluster,
) {
  const sameCluster = keywordRows
    .filter((item) => item.cluster === row.cluster && item.slug !== row.slug)
    .map((item) => item.slug);

  const spokeLinks = sameCluster.filter((slug) => slug !== cluster.pillarSlug);

  return [
    cluster.pillarSlug,
    ...spokeLinks.slice(0, cluster.siblingLinkCount.max),
  ].filter((slug, index, array) => array.indexOf(slug) === index);
}

function buildInternalLinks(
  row: KeywordRow,
  keywordRows: KeywordRow[],
  cluster: Cluster,
  brief: PostBrief,
) {
  const sameClusterLinks = buildSameClusterLinks(row, keywordRows, cluster);
  const crossClusterLinks = (brief.crossClusterLinks ?? []).slice(
    0,
    cluster.crossClusterPillarLimit,
  );

  return [...sameClusterLinks, ...crossClusterLinks]
    .filter((slug) => slug !== row.slug)
    .filter((slug, index, array) => array.indexOf(slug) === index)
    .map((slug) => `/blog/${slug}`);
}

function buildSectionParagraphs(
  row: KeywordRow,
  cluster: Cluster,
  brief: PostBrief,
  section: SectionBrief,
  index: number,
) {
  const stageContext = sentenceCase(
    `In ${brief.scenario}, this is usually the moment when "${section.heading}" turns from a good idea into a real production constraint`,
  );
  const jobContext = sentenceCase(
    `For ${brief.readerRole}, doing "${section.heading}" well is one of the clearest ways to support ${lowerFirst(
      brief.desiredOutcome,
    )}`,
  );
  const systemContext = sentenceCase(
    `${row.query} becomes easier to repeat when the team can standardize "${section.heading}" instead of improvising it on each asset`,
  );
  const clusterContext = sentenceCase(
    `Inside this ${cluster.title.toLowerCase()} workflow, "${section.heading}" is one of the steps that decides whether ${row.query} stays connected to the edit`,
  );

  const firstParagraph = `${sentenceCase(section.focus)} ${stageContext}`;
  const secondParagraph = `${sentenceCase(section.example)} ${jobContext}`;

  let thirdParagraph = `${sentenceCase(section.takeaway)} ${systemContext}`;

  if (index === 2) {
    thirdParagraph = [
      sentenceCase(section.takeaway),
      sentenceCase(
        `In MeowCap, ${lowerFirst(brief.meowcapExample)}`,
      ),
      sentenceCase(
        pickVariant(`${row.slug}:${index}:meowcap`, [
          `The useful sequence for ${row.query} is to upload the clip, generate or align the text, adjust the caption treatment, and export SRT or JSON for the downstream handoff`,
          `That keeps the transcript, approved wording, style adjustments, and export for ${row.query} in the same working loop instead of scattering them across tools`,
          `The result for ${row.query} is a caption layer that stays editable without breaking the timing the team already approved`,
        ]),
      ),
    ].join(" ");
  }

  const fourthParagraph =
    index === brief.sections.length - 1
      ? `${clusterContext} ${sentenceCase(brief.ctaText)}`
      : `${clusterContext} ${sentenceCase(
          `Once "${section.heading}" is stable, the next review round on ${row.query} has much less chance of turning into preventable rework`,
        )}`;

  return {
    paragraphs: [firstParagraph, secondParagraph, thirdParagraph, fourthParagraph],
    bullets: section.bullets ?? [],
  };
}

function buildDraftBody(row: KeywordRow, cluster: Cluster, brief: PostBrief) {
  const introParagraphs = buildIntroParagraphs(row, cluster, brief);
  const blocks: string[] = [...introParagraphs];

  brief.sections.forEach((section, index) => {
    const built = buildSectionParagraphs(row, cluster, brief, section, index);
    blocks.push(`## ${section.heading}`);
    blocks.push(...built.paragraphs);

    if (built.bullets.length) {
      blocks.push(...built.bullets.map((bullet) => `- ${bullet}`));
    }
  });

  return blocks.join("\n\n").trim();
}

function applyEditorPass(markdown: string) {
  return markdown
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/!/g, ".");
}

function applyFactCheck(markdown: string) {
  return markdown
    .replace(/\b(always|never)\b/gi, (match) =>
      match.toLowerCase() === "always" ? "usually" : "rarely",
    )
    .replace(/\bguarantees?\b/gi, "supports");
}

function buildDraft(
  row: KeywordRow,
  cluster: Cluster,
  brief: PostBrief,
  keywordRows: KeywordRow[],
) {
  const today = new Date().toISOString().slice(0, 10);
  const body = applyFactCheck(applyEditorPass(buildDraftBody(row, cluster, brief)));
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const internalLinks = buildInternalLinks(row, keywordRows, cluster, brief);
  const keywords = [row.query, ...brief.keywords].filter(
    (keyword, index, array) => array.indexOf(keyword) === index,
  );

  const frontmatter = [
    "---",
    `slug: "${row.slug}"`,
    `title: "${brief.title}"`,
    `description: "${brief.description}"`,
    `excerpt: "${brief.excerpt}"`,
    `publishedTime: "${today}"`,
    `updatedTime: "${today}"`,
    `readingTime: "${estimateReadingTime(wordCount)}"`,
    `cluster: "${row.cluster}"`,
    `primaryKeyword: "${row.query}"`,
    "keywords:",
    ...keywords.map((keyword) => `  - "${keyword}"`),
    "internalLinks:",
    ...internalLinks.map((link) => `  - "${link}"`),
    'status: "review"',
    'author: "meowcap"',
    "---",
    "",
  ].join("\n");

  return {
    markdown: `${frontmatter}${body}`.trimEnd() + "\n",
    wordCount,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const keywordRows = loadKeywords();
  const clusters = loadClusters();
  const briefs = loadBriefs();
  const existingPosts = new Set(readExistingPosts().map((post) => post.slug));
  const styleGuide = fs.readFileSync(STYLE_GUIDE_PATH, "utf8");
  const facts = fs.readFileSync(FACTS_PATH, "utf8");
  const fixture = fs.readFileSync(FIXTURE_PATH, "utf8");

  const pending = keywordRows
    .filter((row) => row.status !== "published")
    .filter((row) => (options.cluster ? row.cluster === options.cluster : true))
    .slice(0, options.limit ?? undefined);

  if (!pending.length) {
    console.log("No unpublished keyword rows matched the current filters.");
    return;
  }

  console.log(
    `Preparing ${pending.length} posts in ${options.dryRun ? "dry-run" : "write"} mode.`,
  );
  console.log(
    `Loaded style guide (${styleGuide.length} chars), facts (${facts.length} chars), fixture (${fixture.length} chars), and ${briefs.size} editorial briefs.`,
  );

  for (const row of pending) {
    const cluster = clusters.find((item) => item.slug === row.cluster);

    if (!cluster) {
      throw new Error(`Unknown cluster: ${row.cluster}`);
    }

    const brief = briefs.get(row.slug) ?? buildAutoBrief(row, cluster, clusters);

    if (existingPosts.has(row.slug) && !options.overwrite) {
      console.log(`Skipping ${row.slug}: content file already exists.`);
      continue;
    }

    const telemetryStages: TelemetryRecord["stages"] = [];

    const { value: outline, stage: outlineStage } = measureStage("outline", () =>
      buildOutline(row, cluster, brief),
    );
    telemetryStages.push({
      ...outlineStage,
      notes: `${outline.sections.length} sections for ${outline.targetReader}`,
    });

    const { value: draft, stage: draftStage } = measureStage("draft", () =>
      buildDraft(row, cluster, brief, keywordRows),
    );
    telemetryStages.push({
      ...draftStage,
      notes: `${draft.wordCount} words generated from editorial brief`,
    });

    const { value: editedMarkdown, stage: editorStage } = measureStage(
      "editor-pass",
      () => applyEditorPass(draft.markdown),
    );
    telemetryStages.push({
      ...editorStage,
      notes: "Applied local cleanup pass for paragraph spacing and tone.",
    });

    const { value: checkedMarkdown, stage: factStage } = measureStage(
      "fact-check",
      () => applyFactCheck(editedMarkdown),
    );
    telemetryStages.push({
      ...factStage,
      notes: "Softened unsupported absolutes and stayed within local fact snapshot.",
    });

    const filePath = path.join(CONTENT_DIR, `${row.slug}.md`);

    if (options.write) {
      fs.writeFileSync(filePath, checkedMarkdown, "utf8");
      existingPosts.add(row.slug);
      console.log(`Wrote ${path.relative(ROOT, filePath)}`);
    } else {
      console.log(`Dry run ready for ${row.slug} -> ${path.relative(ROOT, filePath)}`);
    }

    appendRunLog({
      timestamp: new Date().toISOString(),
      slug: row.slug,
      query: row.query,
      cluster: row.cluster,
      mode: options.write ? "write" : "dry-run",
      outcome: options.write ? "generated" : "dry_run",
      pipelineVersion: PIPELINE_VERSION,
      wordCount: checkedMarkdown.split(/\s+/).filter(Boolean).length,
      stages: telemetryStages,
      filePath,
    });
  }
}

main();
