import fs from "node:fs";
import path from "node:path";

type Frontmatter = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedTime: string;
  updatedTime: string;
  readingTime: string;
  cluster: string;
  primaryKeyword: string;
  keywords: string[];
  internalLinks: string[];
  status: string;
  author: string;
};

type ParsedPost = {
  filePath: string;
  frontmatter: Frontmatter;
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const STYLE_GUIDE_PATH = path.join(process.cwd(), "docs", "blog-style.md");
const MIN_WORD_COUNT = Number(process.env.BLOG_MIN_WORD_COUNT ?? 1100);
const MAX_WORD_COUNT = Number(process.env.BLOG_MAX_WORD_COUNT ?? 2200);

function parseScalarValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const closingFence = normalized.indexOf("\n---\n", 4);

  if (!normalized.startsWith("---\n") || closingFence === -1) {
    throw new Error("Post is missing valid frontmatter fences.");
  }

  const frontmatterBlock = normalized.slice(4, closingFence);
  const body = normalized.slice(closingFence + 5).trim();
  const data: Record<string, unknown> = {};
  let activeArrayKey: string | null = null;

  for (const line of frontmatterBlock.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const arrayMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayMatch && activeArrayKey) {
      const current = data[activeArrayKey];
      if (!Array.isArray(current)) {
        throw new Error(`Frontmatter key \`${activeArrayKey}\` is not an array.`);
      }
      current.push(parseScalarValue(arrayMatch[1]));
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!keyValueMatch) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const [, key, rawValue = ""] = keyValueMatch;

    if (!rawValue.trim()) {
      data[key] = [];
      activeArrayKey = key;
      continue;
    }

    data[key] = parseScalarValue(rawValue);
    activeArrayKey = null;
  }

  return {
    filePath: "",
    frontmatter: data as Frontmatter,
    body,
  };
}

function getWordCount(body: string) {
  return body
    .replace(/[`*_#>-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseBannedPhrases() {
  const styleGuide = fs.readFileSync(STYLE_GUIDE_PATH, "utf8");
  const sectionMatch = styleGuide.match(
    /## Banned Phrases\n\n([\s\S]*?)\n## /,
  );

  if (!sectionMatch) {
    return [];
  }

  return sectionMatch[1]
    .split("\n")
    .map((line: string) => line.trim())
    .filter(Boolean)
    .map((line: string) => line.replace(/^- /, "").trim().toLowerCase());
}

function splitParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .filter((chunk) => !chunk.startsWith("## ") && !chunk.startsWith("### "))
    .filter((chunk) => !chunk.startsWith("- "));
}

function getSentenceCount(text: string) {
  return text
    .split(/[.!?](?:\s|$)/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function getHeadings(body: string, marker: "##" | "###") {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith(`${marker} `))
    .map((line) => line.slice(marker.length + 1).trim());
}

function normalizeSentence(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSentences(body: string) {
  return body
    .replace(/\n+/g, " ")
    .split(/[.!?](?:\s|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 60)
    .map(normalizeSentence)
    .filter(Boolean);
}

function validatePost(post: ParsedPost, knownLinks: Set<string>, banned: string[]) {
  const issues: string[] = [];
  const wordCount = getWordCount(post.body);
  const h2s = getHeadings(post.body, "##");
  const h3s = getHeadings(post.body, "###");
  const lowerBody = post.body.toLowerCase();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.frontmatter.publishedTime)) {
    issues.push("publishedTime must use YYYY-MM-DD.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.frontmatter.updatedTime)) {
    issues.push("updatedTime must use YYYY-MM-DD.");
  }

  if (post.frontmatter.description.length > 155) {
    issues.push("description exceeds 155 characters.");
  }

  if (post.frontmatter.excerpt.length > 220) {
    issues.push("excerpt exceeds 220 characters.");
  }

  if (!/^\d+\s+min read$/i.test(post.frontmatter.readingTime)) {
    issues.push("readingTime must look like `7 min read`.");
  }

  if (wordCount < MIN_WORD_COUNT || wordCount > MAX_WORD_COUNT) {
    issues.push(
      `word count ${wordCount} is outside the ${MIN_WORD_COUNT}-${MAX_WORD_COUNT} target range.`,
    );
  }

  if (h2s.length < 4 || h2s.length > 7) {
    issues.push("posts should contain 4 to 7 H2 sections.");
  }

  const duplicateH2 = h2s.find(
    (heading, index) => h2s.findIndex((candidate) => candidate === heading) !== index,
  );
  if (duplicateH2) {
    issues.push(`duplicate H2 heading detected: "${duplicateH2}".`);
  }

  for (const paragraph of splitParagraphs(post.body)) {
    const sentences = getSentenceCount(paragraph);
    if (sentences > 4) {
      issues.push("paragraph exceeds the 4-sentence maximum.");
      break;
    }
  }

  if (!lowerBody.includes("meowcap")) {
    issues.push("body must include at least one MeowCap example or reference.");
  }

  for (const phrase of banned) {
    if (phrase && lowerBody.includes(phrase)) {
      issues.push(`banned phrase found: "${phrase}".`);
    }
  }

  for (const link of post.frontmatter.internalLinks ?? []) {
    if (!knownLinks.has(link)) {
      issues.push(`internal link does not resolve: ${link}`);
    }
  }

  if (h3s.length && h3s.length > h2s.length * 2) {
    issues.push("too many H3s relative to H2s.");
  }

  return issues;
}

function main() {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file: string) => file.endsWith(".md"))
    .sort();
  const banned = parseBannedPhrases();
  const posts = files.map((file: string) => {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = parseFrontmatter(raw);
    parsed.filePath = filePath;
    return parsed;
  });

  const knownLinks = new Set(
    posts.map((post) => `/blog/${post.frontmatter.slug}`),
  );
  const sentenceMap = new Map<string, string[]>();
  const issues: string[] = [];

  for (const post of posts) {
    const postIssues = validatePost(post, knownLinks, banned);
    for (const issue of postIssues) {
      issues.push(`${path.basename(post.filePath)}: ${issue}`);
    }

    for (const sentence of getSentences(post.body)) {
      const current = sentenceMap.get(sentence) ?? [];
      current.push(post.frontmatter.slug);
      sentenceMap.set(sentence, current);
    }
  }

  for (const [sentence, owners] of sentenceMap.entries()) {
    if (owners.length > 1) {
      issues.push(
        `Repeated long sentence across posts (${owners.join(", ")}): "${sentence.slice(0, 96)}..."`,
      );
    }
  }

  if (issues.length) {
    console.error("Blog validation failed:\n");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validated ${posts.length} posts. No schema, link, style, or duplication issues found.`,
  );
}

main();
