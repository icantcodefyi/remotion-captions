import { getPublishedPostSummaries } from "@/lib/posts";
import { absoluteUrl, siteConfig } from "@/lib/site";

export function GET() {
  const blogPosts = getPublishedPostSummaries();
  const lines = [
    `# ${siteConfig.name}`,
    `> ${siteConfig.description}`,
    "",
    "## Primary Pages",
    `- Home: ${absoluteUrl("/")} - Interactive AI caption generator for short-form video teams.`,
    `- Blog: ${absoluteUrl("/blog")} - Guides on caption workflows, short-form video SEO, and subtitle operations.`,
    "",
    "## Core Capabilities",
    "- Browser-based transcription workflow",
    "- Script alignment to word-level timing",
    "- Animated caption style previews",
    "- SRT and JSON export",
    "",
    "## Key Resources",
    ...blogPosts.map(
      (post) => `- ${absoluteUrl(`/blog/${post.slug}`)} - ${post.description}`,
    ),
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
