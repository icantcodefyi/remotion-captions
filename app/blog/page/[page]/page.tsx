import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPaginatedPostSummaries,
  getPostPageCount,
} from "@/lib/posts";
import { blogConfig, getStudioHref, siteConfig } from "@/lib/site";

type PageProps = {
  params: Promise<{ page: string }>;
};

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  const totalPages = getPostPageCount(blogConfig.archivePageSize);
  return Array.from({ length: totalPages }, (_, index) => ({
    page: String(index + 1),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { page: rawPage } = await params;
  const page = Number(rawPage);

  if (!Number.isInteger(page) || page < 1) {
    return {};
  }

  return {
    title: page === 1 ? "Archive page 1" : `Archive page ${page}`,
    description:
      "Browse the paginated MeowCap journal archive by publication date.",
    alternates: {
      canonical: `/blog/page/${page}`,
    },
    openGraph: {
      title:
        page === 1
          ? `Archive | ${siteConfig.name} Journal`
          : `Archive page ${page} | ${siteConfig.name} Journal`,
      description:
        "Browse the paginated MeowCap journal archive by publication date.",
      url: `/blog/page/${page}`,
    },
  };
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogArchivePage({ params }: PageProps) {
  const { page: rawPage } = await params;
  const page = Number(rawPage);
  const totalPages = getPostPageCount(blogConfig.archivePageSize);

  if (!Number.isInteger(page) || page < 1 || page > totalPages) {
    notFound();
  }

  const posts = getPaginatedPostSummaries(page, blogConfig.archivePageSize);
  const previousHref = page > 1 ? `/blog/page/${page - 1}` : null;
  const nextHref = page < totalPages ? `/blog/page/${page + 1}` : null;

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
            <span className="text-[color:var(--fg)]">Archive</span>
          </nav>

          <div className="flex items-end justify-between flex-wrap gap-5 border-b border-[color:var(--border)] pb-6">
            <div className="flex flex-col gap-3 max-w-3xl">
              <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                <span className="inline-block w-6 h-px bg-[color:var(--accent-ink)]" />
                <span>Paginated archive</span>
              </div>
              <h1 className="display text-[2rem] md:text-[3.25rem] leading-[0.98] tracking-[-0.04em] text-[color:var(--fg)] text-balance">
                Archive page {page}.
              </h1>
              <p className="ital-label text-[1rem] md:text-[1.1rem] leading-8 text-[color:var(--fg-weak)] max-w-2xl">
                Browse the journal by publication date, or jump to the search
                page when you need the whole index at once.
              </p>
            </div>

            <div className="flex flex-col gap-1 text-right">
              <span className="tnum-serif not-italic text-[color:var(--fg)] display text-[2.5rem] md:text-[3.25rem] leading-none tracking-[-0.04em]">
                {String(page).padStart(2, "0")}
              </span>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                of {String(totalPages).padStart(2, "0")}
              </span>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[color:var(--border)] pb-3 text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
          <div className="flex items-center gap-3">
            <span>Showing</span>
            <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
              {String(posts.length).padStart(2, "0")}
            </span>
            <span>posts</span>
          </div>
          <Link
            href="/blog/all"
            className="text-[color:var(--accent-ink)] font-semibold"
          >
            Search the full archive
          </Link>
        </div>

        <ol className="flex flex-col">
          {posts.map((post, index) => (
            <li key={post.slug}>
              <Link
                href={post.href}
                className="group block py-6 md:py-7 border-b border-[color:var(--border)] hover:bg-[color:var(--surface-1)] transition-colors -mx-2 px-2 md:-mx-4 md:px-4 rounded-lg"
              >
                <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-8">
                  <div className="flex items-baseline gap-4 md:w-44 shrink-0">
                    <span
                      aria-hidden
                      className="tnum-serif not-italic text-[color:var(--muted)] text-[0.85rem]"
                    >
                      {String((page - 1) * blogConfig.archivePageSize + index + 1).padStart(
                        2,
                        "0",
                      )}
                    </span>
                    <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
                      {formatDate(post.publishedTime)}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                      <span>{post.cluster.replace(/-/g, " ")}</span>
                      {post.isPillar ? <span>pillar</span> : null}
                    </div>
                    <h2 className="display text-[1.25rem] md:text-[1.55rem] leading-[1.15] tracking-[-0.03em] text-[color:var(--fg)] group-hover:text-[color:var(--accent-ink)] transition-colors text-balance">
                      {post.title}
                    </h2>
                    <p className="ital-label text-[0.98rem] leading-7 text-[color:var(--fg-weak)] line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)] md:w-32 md:justify-end md:text-right shrink-0">
                    <span>{post.readingTime}</span>
                    <span
                      aria-hidden
                      className="display text-[color:var(--accent-ink)] text-[1.1rem] transition-transform group-hover:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        <nav className="flex items-center justify-between gap-4 flex-wrap border-t border-[color:var(--border)] pt-6">
          {previousHref ? (
            <Link
              href={previousHref}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 border border-[color:var(--border)] bg-[color:var(--surface-1)] text-[0.82rem] font-semibold text-[color:var(--fg)]"
            >
              <span aria-hidden>&larr;</span>
              Previous page
            </Link>
          ) : (
            <span className="text-[0.78rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Start of archive
            </span>
          )}

          <span className="text-[0.78rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Page {page} of {totalPages}
          </span>

          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 border border-[color:var(--border)] bg-[color:var(--surface-1)] text-[0.82rem] font-semibold text-[color:var(--fg)]"
            >
              Next page
              <span aria-hidden>&rarr;</span>
            </Link>
          ) : (
            <span className="text-[0.78rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              End of archive
            </span>
          )}
        </nav>

        <aside className="panel p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
              Try {siteConfig.shortName}
            </div>
            <h2 className="display text-[1.4rem] md:text-[1.8rem] leading-[1.05] tracking-[-0.03em] text-[color:var(--fg)] text-balance">
              Turn what you just read into a caption workflow your team can
              reuse.
            </h2>
          </div>
          <Link
            href={getStudioHref("archive_page")}
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
