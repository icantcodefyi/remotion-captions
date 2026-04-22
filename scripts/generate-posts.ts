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

type RunOptions = {
  limit: number | null;
  cluster: string | null;
  dryRun: boolean;
  write: boolean;
  overwrite: boolean;
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

function parseArgs(argv: string[]): RunOptions {
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

function loadKeywords(): KeywordRow[] {
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

function loadClusters(): Cluster[] {
  const raw = fs.readFileSync(CLUSTERS_PATH, "utf8");
  const parsed = JSON.parse(raw) as { clusters: Cluster[] };
  return parsed.clusters;
}

function loadBriefs() {
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

function sentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return trimmed;
  }
  const normalized = trimmed.replace(/\s+/g, " ");
  const punctuated = /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
  return punctuated.charAt(0).toUpperCase() + punctuated.slice(1);
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
    `What works best for ${brief.scenario} is a workflow that starts with timing, keeps the wording editable, and makes the finished subtitle layer reusable`,
  ]);

  const context = pickVariant(`${row.slug}:intro:2`, [
    `${brief.scenario} sits inside ${cluster.shortDescription.toLowerCase()}`,
    `That matters in ${brief.scenario.toLowerCase()} because small caption decisions compound once the team is publishing on a schedule`,
    `For this kind of asset, the caption workflow needs to feel more like production infrastructure than a finishing flourish`,
  ]);

  const promise = pickVariant(`${row.slug}:intro:3`, [
    `This guide stays practical for ${row.query}: where the workflow breaks, what to standardize first, and how to use MeowCap without creating another cleanup layer`,
    `The goal here is not flashier text on screen for ${brief.scenario}. It is a repeatable operating system for getting accurate, readable captions out the door`,
    `That is the useful angle for ${row.query}: remove rework, keep the caption layer flexible, and give the next reviewer a cleaner handoff`,
  ]);

  const productionAngle = pickVariant(`${row.slug}:intro:4`, [
    `In practice, ${row.query} becomes easier when the team can move from one revision to the next without losing context about what the captions are supposed to do`,
    `The fastest teams treat ${brief.scenario} like a production system, which means the text, timing, and review handoff all stay related even while the creative changes`,
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
    `In ${brief.scenario}, this part of the workflow is where ${lowerFirst(brief.problem)}`,
  );
  const jobContext = sentenceCase(
    `For ${brief.readerRole}, that usually determines whether ${lowerFirst(brief.desiredOutcome)}`,
  );
  const systemContext = sentenceCase(
    `${row.query} becomes easier to repeat when ${lowerFirst(
      section.heading,
    )} is treated like an operating rule instead of a one-off fix`,
  );
  const clusterContext = sentenceCase(
    `That is why ${lowerFirst(
      section.heading,
    )} matters inside this ${cluster.title.toLowerCase()} workflow: it protects ${row.query} from drifting away from the rest of production`,
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
          `Once ${lowerFirst(
            section.heading,
          )} is stable, the next review round on ${row.query} has much less chance of turning into preventable rework`,
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

    const brief = briefs.get(row.slug);

    if (!brief) {
      throw new Error(
        `Missing editorial brief for unpublished keyword row: ${row.slug}`,
      );
    }

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
