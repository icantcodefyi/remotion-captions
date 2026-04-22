import { getSearchEntries } from "@/lib/posts";
import { blogConfig } from "@/lib/site";

export const revalidate = blogConfig.revalidateSeconds;

export function GET() {
  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      posts: getSearchEntries(),
    },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${blogConfig.revalidateSeconds}`,
      },
    },
  );
}
