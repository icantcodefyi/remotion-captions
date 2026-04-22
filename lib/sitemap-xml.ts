import { getPostsByCluster } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
};

export function renderUrlset(urls: SitemapEntry[]) {
  const entries = urls
    .map((item) => {
      const lastmod = item.lastModified
        ? `<lastmod>${new Date(item.lastModified).toISOString()}</lastmod>`
        : "";
      const changefreq = item.changeFrequency
        ? `<changefreq>${item.changeFrequency}</changefreq>`
        : "";
      const priority =
        typeof item.priority === "number"
          ? `<priority>${item.priority.toFixed(1)}</priority>`
          : "";

      return `<url><loc>${item.url}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export function getCoreSitemapEntries() {
  const now = new Date().toISOString();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/blog/all"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/blog/page/1"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}

export function getClusterSitemapEntries(clusterSlug: string) {
  const posts = getPostsByCluster(clusterSlug);

  return [
    {
      url: absoluteUrl(`/blog/cluster/${clusterSlug}`),
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(post.href),
      lastModified: post.updatedTime,
      changeFrequency: "monthly",
      priority: post.isPillar ? 0.8 : 0.7,
    })),
  ];
}

export function xmlResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
