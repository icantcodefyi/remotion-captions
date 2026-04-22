import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const readingTimePattern = /^\d+\s+min read$/i;

export const blogPostStatusSchema = z.enum(["draft", "review", "published"]);

export const blogPostAuthorSchema = z.enum(["meowcap"]);

export const blogPostFrontmatterSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case."),
  title: z.string().min(1),
  description: z
    .string()
    .min(1)
    .max(155, "Description should stay within 155 characters."),
  excerpt: z
    .string()
    .min(1)
    .max(220, "Excerpt should stay within 220 characters."),
  publishedTime: z
    .string()
    .regex(isoDatePattern, "publishedTime must use YYYY-MM-DD."),
  updatedTime: z
    .string()
    .regex(isoDatePattern, "updatedTime must use YYYY-MM-DD."),
  readingTime: z
    .string()
    .regex(readingTimePattern, "readingTime must look like `7 min read`."),
  cluster: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Cluster must be kebab-case."),
  primaryKeyword: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  internalLinks: z.array(z.string().startsWith("/blog/")).default([]),
  status: blogPostStatusSchema,
  author: blogPostAuthorSchema,
});

export const clusterDefinitionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Cluster slug must be kebab-case."),
  title: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().min(1),
  pillarSlug: z.string().min(1),
  audience: z.string().min(1),
  sitemapId: z.string().min(1),
  targetArchivePageSize: z.number().int().positive().default(24),
  siblingLinkCount: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  }),
  crossClusterPillarLimit: z.number().int().min(0).default(1),
});

export const clusterCollectionSchema = z.object({
  clusters: z.array(clusterDefinitionSchema).min(1),
});

export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;
export type BlogPostAuthor = z.infer<typeof blogPostAuthorSchema>;
export type BlogPostFrontmatter = z.infer<typeof blogPostFrontmatterSchema>;
export type ClusterDefinition = z.infer<typeof clusterDefinitionSchema>;
export type ClusterCollection = z.infer<typeof clusterCollectionSchema>;

export type BlogContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "subheading";
      heading: string;
    };

export type BlogSection = {
  heading: string;
  blocks: BlogContentBlock[];
};

export type BlogPostSummary = BlogPostFrontmatter & {
  href: `/blog/${string}`;
  wordCount: number;
  isPillar: boolean;
};

export type BlogPost = BlogPostSummary & {
  body: string;
  intro: BlogContentBlock[];
  sections: BlogSection[];
  sourcePath: string;
};

export type BlogSearchEntry = Pick<
  BlogPostSummary,
  | "slug"
  | "title"
  | "description"
  | "excerpt"
  | "publishedTime"
  | "updatedTime"
  | "readingTime"
  | "cluster"
  | "primaryKeyword"
  | "keywords"
  | "internalLinks"
  | "href"
  | "wordCount"
  | "isPillar"
>;
