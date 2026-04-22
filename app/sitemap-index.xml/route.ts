import { getAllClusters } from "@/lib/posts";
import { absoluteUrl, blogConfig } from "@/lib/site";

export const revalidate = blogConfig.revalidateSeconds;

function renderSitemapIndex(urls: string[]) {
  const entries = urls
    .map(
      (url) => `<sitemap><loc>${url}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function GET() {
  const clusterUrls = getAllClusters().map((cluster) =>
    absoluteUrl(`/sitemaps/${cluster.sitemapId}.xml`),
  );

  const xml = renderSitemapIndex([
    absoluteUrl("/sitemaps/core.xml"),
    ...clusterUrls,
  ]);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
