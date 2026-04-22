import {
  getClusterSitemapEntries,
  renderUrlset,
  xmlResponse,
} from "@/lib/sitemap-xml";

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;

export function GET() {
  return xmlResponse(renderUrlset(getClusterSitemapEntries("creator-workflow")));
}
