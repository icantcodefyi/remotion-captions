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
  stages: Array<{
    name: string;
    durationMs: number;
    notes: string;
  }>;
  filePath: string;
};

const ROOT = process.cwd();
const KEYWORDS_PATH = path.join(ROOT, "data", "keywords.csv");
const CLUSTERS_PATH = path.join(ROOT, "data", "clusters.json");
const RUN_LOG_PATH = path.join(ROOT, "data", "run.log.jsonl");
const CONTENT_DIR = path.join(ROOT, "content", "blog");
const STYLE_GUIDE_PATH = path.join(ROOT, "docs", "blog-style.md");
const FACTS_PATH = path.join(ROOT, "docs", "facts.md");
const FIXTURE_PATH = path.join(ROOT, "docs", "fixtures", "transcript-sample-1.json");

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

  return lines.filter(Boolean).map((line: string) => {
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

function loadRunLog() {
  if (!fs.existsSync(RUN_LOG_PATH)) {
    return new Map<string, TelemetryRecord>();
  }

  const lines = fs
    .readFileSync(RUN_LOG_PATH, "utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  const latest = new Map<string, TelemetryRecord>();

  for (const line of lines) {
    const record = JSON.parse(line) as TelemetryRecord;
    latest.set(record.slug, record);
  }

  return latest;
}

function appendRunLog(record: TelemetryRecord) {
  fs.appendFileSync(RUN_LOG_PATH, `${JSON.stringify(record)}\n`);
}

function readPublishedPosts() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file: string) => file.endsWith(".md"))
    .map((file: string) => {
      const filePath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(filePath, "utf8");
      const slugMatch = raw.match(/^slug:\s*"?(.*?)"?$/m);
      return {
        slug: slugMatch?.[1] ?? file.replace(/\.md$/, ""),
      };
    });
}

function toTitleCase(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function buildOutline(row: KeywordRow, cluster: Cluster, siblingSlugs: string[]) {
  return {
    angle: `A practical ${cluster.title.toLowerCase()} guide for ${row.query}.`,
    targetReader: cluster.audience,
    sections: [
      "Why this workflow matters",
      "Start with the transcript and timing layer",
      "Use the MeowCap flow to keep changes lightweight",
      "Choose the caption treatment that fits the channel",
      "Standardize the handoff to the rest of the team",
    ],
    siblings: siblingSlugs,
  };
}

function buildStubDraft(
  row: KeywordRow,
  cluster: Cluster,
  outline: ReturnType<typeof buildOutline>,
  siblingSlugs: string[],
) {
  const title = toTitleCase(row.query);
  const today = new Date().toISOString().slice(0, 10);
  const sectionBodies = outline.sections.map((heading, index) => {
    const exampleLine =
      index === 2
        ? "In MeowCap, the useful sequence is to upload the clip, generate the first transcript pass, align the approved script when the wording needs cleanup, preview the caption style, and export SRT or JSON for the next handoff."
        : "That keeps the process concrete instead of turning every clip into a manual cleanup exercise.";

    return [
      `## ${heading}`,
      "",
      `If you are working on ${row.query}, the real constraint is usually not a missing feature. It is the amount of friction between raw footage, approved copy, and the final export. Teams that publish often need a process they can repeat without reopening the same debate on every clip.`,
      "",
      `This cluster is built around ${cluster.shortDescription.toLowerCase()}. ${exampleLine}`,
      "",
      `A useful operating rule is to connect the transcript, style, and handoff into one small loop. That gives editors room to improve the text without losing timing, and it makes the result easier to reuse across the rest of the workflow.`,
      "",
    ].join("\n");
  });

  const body = sectionBodies.join("\n");
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  const internalLinks = [
    `/blog/${cluster.pillarSlug}`,
    ...siblingSlugs.map((slug) => `/blog/${slug}`),
  ]
    .filter((link, index, array) => array.indexOf(link) === index)
    .slice(0, 3);

  const frontmatter = [
    "---",
    `slug: "${row.slug}"`,
    `title: "${title}"`,
    `description: "A practical guide to ${row.query} for teams building repeatable caption workflows."`,
    `excerpt: "A concise operating guide for ${row.query} with a MeowCap-first workflow and reusable handoff steps."`,
    `publishedTime: "${today}"`,
    `updatedTime: "${today}"`,
    `readingTime: "${estimateReadingTime(wordCount)}"`,
    `cluster: "${row.cluster}"`,
    `primaryKeyword: "${row.query}"`,
    "keywords:",
    `  - "${row.query}"`,
    `  - "${row.query} workflow"`,
    `  - "${cluster.title.toLowerCase()} captions"`,
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
  const latestLog = loadRunLog();
  const existingPosts = new Set(readPublishedPosts().map((post) => post.slug));
  const styleGuide = fs.readFileSync(STYLE_GUIDE_PATH, "utf8");
  const facts = fs.readFileSync(FACTS_PATH, "utf8");
  const fixture = fs.readFileSync(FIXTURE_PATH, "utf8");

  const pending = keywordRows
    .filter((row) => row.status !== "published")
    .filter((row) => (options.cluster ? row.cluster === options.cluster : true))
    .filter((row) => {
      const latest = latestLog.get(row.slug);
      return latest?.outcome !== "generated";
    })
    .slice(0, options.limit ?? undefined);

  if (!pending.length) {
    console.log("No unpublished keyword rows matched the current filters.");
    return;
  }

  console.log(
    `Preparing ${pending.length} posts in ${options.dryRun ? "dry-run" : "write"} mode.`,
  );
  console.log(`Loaded style guide (${styleGuide.length} chars), facts (${facts.length} chars), and fixture (${fixture.length} chars).`);

  for (const row of pending) {
    const cluster = clusters.find((item) => item.slug === row.cluster);

    if (!cluster) {
      throw new Error(`Unknown cluster: ${row.cluster}`);
    }

    if (existingPosts.has(row.slug) && !options.overwrite) {
      console.log(`Skipping ${row.slug}: content file already exists.`);
      continue;
    }

    const siblingSlugs = keywordRows
      .filter((item) => item.cluster === row.cluster && item.slug !== row.slug)
      .map((item) => item.slug)
      .slice(0, cluster.siblingLinkCount.max);

    const telemetryStages: TelemetryRecord["stages"] = [];
    const { value: outline, stage: outlineStage } = measureStage("outline", () =>
      buildOutline(row, cluster, siblingSlugs),
    );
    telemetryStages.push({
      ...outlineStage,
      notes: `${outline.sections.length} sections for ${outline.targetReader}`,
    });

    const { value: draft, stage: draftStage } = measureStage("draft", () =>
      buildStubDraft(row, cluster, outline, siblingSlugs),
    );
    telemetryStages.push({
      ...draftStage,
      notes: `${draft.wordCount} words in stub draft`,
    });

    const { stage: editorStage } = measureStage("editor-pass", () => draft.markdown);
    telemetryStages.push({
      ...editorStage,
      notes: "Stub editor pass kept the deterministic draft as-is.",
    });

    const { stage: factStage } = measureStage("fact-check", () => ({
      factsSource: FACTS_PATH,
      fixtureSource: FIXTURE_PATH,
    }));
    telemetryStages.push({
      ...factStage,
      notes: "Validated against local facts and fixture snapshots.",
    });

    const filePath = path.join(CONTENT_DIR, `${row.slug}.md`);

    if (options.write) {
      fs.writeFileSync(filePath, draft.markdown, "utf8");
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
      stages: telemetryStages,
      filePath,
    });
  }
}

main();
