import type { Metadata } from "next";
import Link from "next/link";
import { BlogSearchArchive } from "@/components/pages/blog-search-archive";
import { getPublishedPostSummaries } from "@/lib/posts";
import { blogConfig, getStudioHref, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "All articles",
  description:
    "Browse every article in the MeowCap journal. Search and filter guides on animated captions, subtitle workflows, short-form repurposing, and caption operations.",
  alternates: {
    canonical: "/blog/all",
  },
  openGraph: {
    title: `All articles | ${siteConfig.name} Journal`,
    description:
      "Browse every article in the MeowCap journal. Search and filter by topic.",
    url: "/blog/all",
  },
};

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;

export default function AllBlogPostsPage() {
  const posts = getPublishedPostSummaries();

  return (
    <main className="relative px-4 md:px-6 py-10 md:py-14">
      <div className="mx-auto max-w-5xl flex flex-col gap-10 md:gap-12">
        <header className="flex flex-col gap-6">
          <nav className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            <Link
              href="/"
              className="hover:text-[color:var(--fg)] transition-colors"
            >
              {siteConfig.shortName}
            </Link>
            <span aria-hidden>/</span>
            <Link
              href="/blog"
              className="hover:text-[color:var(--fg)] transition-colors"
            >
              Journal
            </Link>
            <span aria-hidden>/</span>
            <span className="text-[color:var(--fg)]">All articles</span>
          </nav>

          <div className="flex items-end justify-between flex-wrap gap-5 border-b border-[color:var(--border)] pb-6">
            <div className="flex flex-col gap-3 max-w-3xl">
              <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                <span className="inline-block w-6 h-px bg-[color:var(--accent-ink)]" />
                <span>The archive</span>
              </div>
              <h1 className="display text-[2rem] md:text-[3.25rem] leading-[0.98] tracking-[-0.04em] text-[color:var(--fg)] text-balance">
                Every article in the journal.
              </h1>
              <p className="ital-label text-[1rem] md:text-[1.1rem] leading-8 text-[color:var(--fg-weak)] max-w-2xl">
                Search the full archive or filter by topic. The search index is
                fetched separately so the archive can scale without shipping the
                whole corpus through the page payload.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="tnum-serif not-italic text-[color:var(--fg)] display text-[2.5rem] md:text-[3.25rem] leading-none tracking-[-0.04em]">
                {String(posts.length).padStart(3, "0")}
              </span>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                articles
              </span>
            </div>
          </div>
        </header>

        <BlogSearchArchive indexUrl={blogConfig.searchIndexPath} />

        <aside className="panel p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
              Try {siteConfig.shortName}
            </div>
            <h2 className="display text-[1.4rem] md:text-[1.8rem] leading-[1.05] tracking-[-0.03em] text-[color:var(--fg)] text-balance">
              Go from raw clip to captioned subtitle export in minutes.
            </h2>
          </div>
          <Link
            href={getStudioHref("archive_search")}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.88rem] font-semibold text-[color:var(--accent-deep)] bg-[color:var(--accent)] hover:brightness-[1.04] transition"
          >
            Open the studio
            <span aria-hidden>&rarr;</span>
          </Link>
        </aside>
      </div>
    </main>
  );
}
