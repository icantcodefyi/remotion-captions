export const siteConfig = {
  name: "MeowCap",
  shortName: "MeowCap",
  description:
    "MeowCap is a browser-based AI caption generator for short-form video. Transcribe clips, align scripts, preview animated Remotion styles, and export polished subtitles in minutes.",
  tagline: "AI caption generator for short-form video teams",
  keywords: [
    "AI caption generator",
    "video caption generator",
    "animated captions",
    "Remotion captions",
    "TikTok captions",
    "Instagram Reel captions",
    "YouTube Shorts subtitles",
    "script to captions",
    "subtitle generator",
    "Deepgram captions",
  ],
  authors: [{ name: "MeowCap" }],
};

export const blogConfig = {
  archivePageSize: 24,
  revalidateSeconds: 60 * 60 * 24,
  hotStaticPostCount: 100,
  searchIndexPath: "/blog/search-index.json",
} as const;

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "http://localhost:3000",
  ];

  const siteUrl = candidates.find(Boolean);

  return siteUrl!.replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

function withQuery(
  pathname: string,
  params: Record<string, string | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getStudioHref(campaign: string) {
  return withQuery("/", {
    utm_source: "blog",
    utm_medium: "internal",
    utm_campaign: campaign,
  });
}

export function getBlogHref(pathname: string, campaign: string) {
  return withQuery(pathname, {
    utm_source: "app",
    utm_medium: "internal",
    utm_campaign: campaign,
  });
}
