import type { MetadataRoute } from "next";
import { getAllClusters, getPublishedPostSummaries } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getPublishedPostSummaries();
  const clusters = getAllClusters();

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
    ...clusters.map((cluster) => ({
      url: absoluteUrl(`/blog/cluster/${cluster.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedTime),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
