import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import clustersSource from "../data/clusters.json";
import {
  blogPostFrontmatterSchema,
  clusterCollectionSchema,
  type BlogContentBlock,
  type BlogPost,
  type BlogPostFrontmatter,
  type BlogPostSummary,
  type BlogSection,
} from "./posts-schema";

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "blog");

const clusters = clusterCollectionSchema.parse(clustersSource).clusters;
const clusterMap = new Map(clusters.map((cluster) => [cluster.slug, cluster]));

function comparePostsByDate(a: { publishedTime: string }, b: { publishedTime: string }) {
  return (
    new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime()
  );
}

function parseScalarValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed.length) {
    return "";
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        if (
          (item.startsWith('"') && item.endsWith('"')) ||
          (item.startsWith("'") && item.endsWith("'"))
        ) {
          return item.slice(1, -1);
        }
        return item;
      });
  }

  return trimmed;
}

function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    throw new Error("Post is missing opening frontmatter fence.");
  }

  const closingFence = normalized.indexOf("\n---\n", 4);

  if (closingFence === -1) {
    throw new Error("Post is missing closing frontmatter fence.");
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
    frontmatter: blogPostFrontmatterSchema.parse(data),
    body,
  };
}

function flushParagraph(lines: string[], target: BlogContentBlock[]) {
  if (!lines.length) {
    return;
  }

  target.push({
    type: "paragraph",
    text: lines.join(" ").trim(),
  });
  lines.length = 0;
}

function flushList(items: string[], target: BlogContentBlock[]) {
  if (!items.length) {
    return;
  }

  target.push({
    type: "list",
    items: [...items],
  });
  items.length = 0;
}

function parseMarkdownBody(body: string) {
  const intro: BlogContentBlock[] = [];
  const sections: BlogSection[] = [];
  let currentSection: BlogSection | null = null;
  const paragraphLines: string[] = [];
  const listItems: string[] = [];

  function pushSubheading(heading: string) {
    const target = currentSection?.blocks ?? intro;
    flushParagraph(paragraphLines, target);
    flushList(listItems, target);
    target.push({ type: "subheading", heading });
  }

  function getTarget() {
    return currentSection?.blocks ?? intro;
  }

  const lines = body.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line.length) {
      flushParagraph(paragraphLines, getTarget());
      flushList(listItems, getTarget());
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph(paragraphLines, getTarget());
      flushList(listItems, getTarget());
      currentSection = {
        heading: line.slice(3).trim(),
        blocks: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith("### ")) {
      pushSubheading(line.slice(4).trim());
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph(paragraphLines, getTarget());
      listItems.push(line.slice(2).trim());
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph(paragraphLines, getTarget());
  flushList(listItems, getTarget());

  const wordCount = body
    .replace(/[`*_#>-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    intro,
    sections,
    body,
    wordCount,
  };
}

function getHref(slug: string) {
  return `/blog/${slug}` as const;
}

function listPostFiles() {
  return readdirSync(POSTS_DIRECTORY)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

function readPostSource(slug: string) {
  const filePath = path.join(POSTS_DIRECTORY, `${slug}.md`);
  const raw = readFileSync(filePath, "utf8");
  return { filePath, raw };
}

function parsePost(slug: string) {
  const { filePath, raw } = readPostSource(slug);
  const { frontmatter, body } = parseFrontmatter(raw);
  const cluster = getCluster(frontmatter.cluster);
  const markdown = parseMarkdownBody(body);

  return {
    ...frontmatter,
    href: getHref(frontmatter.slug),
    isPillar: cluster.pillarSlug === frontmatter.slug,
    wordCount: markdown.wordCount,
    body,
    intro: markdown.intro,
    sections: markdown.sections,
    sourcePath: filePath,
  };
}

function createSummary(frontmatter: BlogPostFrontmatter, body: string) {
  const cluster = getCluster(frontmatter.cluster);
  return {
    ...frontmatter,
    href: getHref(frontmatter.slug),
    isPillar: cluster.pillarSlug === frontmatter.slug,
    wordCount: body
      .replace(/[`*_#>-]/g, " ")
      .split(/\s+/)
      .filter(Boolean).length,
  } satisfies BlogPostSummary;
}

let cachedSlugs: string[] | null = null;
let cachedSummaries: BlogPostSummary[] | null = null;
const cachedPosts = new Map<string, BlogPost>();

function getCachedPostSlugs() {
  if (cachedSlugs === null) {
    cachedSlugs = listPostFiles().map((file) => file.replace(/\.md$/, ""));
  }
  return cachedSlugs;
}

function getCachedPostSummaries() {
  if (cachedSummaries === null) {
    const summaries = getCachedPostSlugs().map((slug) => {
      const { raw } = readPostSource(slug);
      const { frontmatter, body } = parseFrontmatter(raw);
      return createSummary(frontmatter, body);
    });
    summaries.sort(comparePostsByDate);
    cachedSummaries = summaries;
  }
  return cachedSummaries;
}

function getCachedPost(slug: string) {
  const existing = cachedPosts.get(slug);
  if (existing) {
    return existing;
  }
  if (!getCachedPostSummaries().some((summary) => summary.slug === slug)) {
    return null;
  }
  const post = parsePost(slug);
  cachedPosts.set(slug, post);
  return post;
}

function ensurePostLinksResolve(post: BlogPostSummary, knownLinks: Set<string>) {
  for (const link of post.internalLinks) {
    if (!knownLinks.has(link)) {
      throw new Error(
        `Post \`${post.slug}\` references missing internal link \`${link}\`.`,
      );
    }
  }
}

function validateClusterAssignments(posts: BlogPostSummary[]) {
  const knownLinks = new Set(posts.map((post) => post.href));

  for (const post of posts) {
    const cluster = getCluster(post.cluster);
    ensurePostLinksResolve(post, knownLinks);

    if (post.internalLinks.length < 1) {
      throw new Error(`Post \`${post.slug}\` must link to at least one related article.`);
    }

    if (!post.isPillar && !post.internalLinks.includes(getHref(cluster.pillarSlug))) {
      throw new Error(
        `Post \`${post.slug}\` must link to its pillar \`${cluster.pillarSlug}\`.`,
      );
    }

    const clusterLinks = post.internalLinks.filter((link) => {
      const linkedPost = posts.find((candidate) => candidate.href === link);
      return linkedPost?.cluster === post.cluster;
    });

    if (!post.isPillar && clusterLinks.length < cluster.siblingLinkCount.min + 1) {
      throw new Error(
        `Post \`${post.slug}\` does not meet the minimum same-cluster link count.`,
      );
    }
  }
}

let corpusValidated = false;

function validateCorpus() {
  if (corpusValidated) {
    return true;
  }

  const summaries = getCachedPostSummaries();
  const slugs = new Set<string>();

  for (const summary of summaries) {
    if (slugs.has(summary.slug)) {
      throw new Error(`Duplicate blog slug detected: \`${summary.slug}\`.`);
    }
    slugs.add(summary.slug);

    if (!clusterMap.has(summary.cluster)) {
      throw new Error(`Post \`${summary.slug}\` uses unknown cluster \`${summary.cluster}\`.`);
    }
  }

  for (const cluster of clusters) {
    if (!summaries.some((post) => post.slug === cluster.pillarSlug)) {
      throw new Error(
        `Cluster \`${cluster.slug}\` references missing pillar \`${cluster.pillarSlug}\`.`,
      );
    }
  }

  validateClusterAssignments(summaries);
  corpusValidated = true;
  return true;
}

export function getAllClusters() {
  return [...clusters];
}

export function getCluster(slug: string) {
  const cluster = clusterMap.get(slug);

  if (!cluster) {
    throw new Error(`Unknown cluster: ${slug}`);
  }

  return cluster;
}

export function getAllPostSummaries() {
  validateCorpus();
  return getCachedPostSummaries();
}

export function getPublishedPostSummaries() {
  return getAllPostSummaries().filter((post) => post.status === "published");
}

export function getPost(slug: string) {
  validateCorpus();
  return getCachedPost(slug);
}

export function getPostsByCluster(clusterSlug: string) {
  return getPublishedPostSummaries().filter((post) => post.cluster === clusterSlug);
}

export function getClusterPostCount(clusterSlug: string) {
  return getPostsByCluster(clusterSlug).length;
}

export function getClusterPillar(clusterSlug: string) {
  const cluster = getCluster(clusterSlug);
  return getPost(cluster.pillarSlug);
}

export function getRelatedPosts(slug: string, limit = 3) {
  const current = getPost(slug);
  if (!current) {
    return [];
  }

  const sameCluster = getPublishedPostSummaries().filter(
    (post) => post.slug !== slug && post.cluster === current.cluster,
  );

  const explicitlyLinked = current.internalLinks
    .map((href) => getPublishedPostSummaries().find((candidate) => candidate.href === href))
    .filter((post): post is BlogPostSummary => Boolean(post))
    .filter((post) => post.slug !== slug);

  const deduped = [...explicitlyLinked, ...sameCluster].filter(
    (post, index, array) =>
      array.findIndex((candidate) => candidate.slug === post.slug) === index,
  );

  return deduped.slice(0, limit);
}

export function getHotPostSummaries(limit = 100) {
  return getPublishedPostSummaries().slice(0, limit);
}

export function getPaginatedPostSummaries(page: number, pageSize: number) {
  const posts = getPublishedPostSummaries();
  const start = (page - 1) * pageSize;
  return posts.slice(start, start + pageSize);
}

export function getPostPageCount(pageSize: number) {
  return Math.max(1, Math.ceil(getPublishedPostSummaries().length / pageSize));
}

export function getSearchEntries() {
  return getPublishedPostSummaries().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    excerpt: post.excerpt,
    publishedTime: post.publishedTime,
    updatedTime: post.updatedTime,
    readingTime: post.readingTime,
    cluster: post.cluster,
    primaryKeyword: post.primaryKeyword,
    keywords: post.keywords,
    internalLinks: post.internalLinks,
    href: post.href,
    wordCount: post.wordCount,
    isPillar: post.isPillar,
  }));
}

export function getSitemapBuckets() {
  const byCluster = new Map<string, BlogPostSummary[]>();

  for (const cluster of getAllClusters()) {
    byCluster.set(cluster.slug, getPostsByCluster(cluster.slug));
  }

  return byCluster;
}

export function getPostSlugs() {
  return getPublishedPostSummaries().map((post) => post.slug);
}

export function getClusterSlugs() {
  return getAllClusters().map((cluster) => cluster.slug);
}
