import { getPublishedPostSummaries } from "@/lib/posts";
import { absoluteUrl, siteConfig } from "@/lib/site";

export function GET() {
  const blogPosts = getPublishedPostSummaries();
  const lines = [
    `# ${siteConfig.name} Full Context`,
    "",
    `Homepage: ${absoluteUrl("/")}`,
    `Blog index: ${absoluteUrl("/blog")}`,
    "",
    "## Product Summary",
    siteConfig.description,
    "",
    "## Articles",
    ...blogPosts.flatMap((post) => [
      "",
      `### ${post.title}`,
      `URL: ${absoluteUrl(`/blog/${post.slug}`)}`,
      `Summary: ${post.description}`,
      `Keywords: ${post.keywords.join(", ")}`,
    ]),
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
