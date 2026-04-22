import { getSearchEntries } from "@/lib/posts";
import { BLOG_REVALIDATE_SECONDS } from "@/lib/site";

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;

export function GET() {
  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      posts: getSearchEntries(),
    },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${BLOG_REVALIDATE_SECONDS}`,
      },
    },
  );
}
