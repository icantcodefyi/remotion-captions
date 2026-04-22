import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllClusters,
  getClusterPillar,
  getPublishedPostSummaries,
  getPostsByCluster,
} from "@/lib/posts";
import { getStudioHref, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Guides on animated captions, subtitle workflows, short-form video repurposing, and brand-safe caption operations.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: `${siteConfig.name} Journal`,
    description:
      "Guides on animated captions, subtitle workflows, and short-form video repurposing.",
    url: "/blog",
  },
};

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  const [lead, ...rest] = getPublishedPostSummaries();
  const recent = rest.slice(0, 4);
  const clusters = getAllClusters()
    .map((cluster) => ({
      ...cluster,
      count: getPostsByCluster(cluster.slug).length,
      pillar: getClusterPillar(cluster.slug),
    }))
    .filter(
      (
        cluster,
      ): cluster is ReturnType<typeof getAllClusters>[number] & {
        count: number;
        pillar: NonNullable<ReturnType<typeof getClusterPillar>>;
      } => Boolean(cluster.pillar),
    );

  return (
    <main className="relative px-4 md:px-6 py-10 md:py-16">
      <div className="mx-auto max-w-6xl flex flex-col gap-10 md:gap-16">
        <header className="flex flex-col gap-6">
          <div className="flex items-end justify-between flex-wrap gap-4 border-b border-[color:var(--border)] pb-4">
            <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              <Link
                href="/"
                className="hover:text-[color:var(--fg)] transition-colors"
              >
                {siteConfig.shortName}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-[color:var(--fg)]">Journal</span>
            </div>
            <div className="ital-label text-[0.85rem] text-[color:var(--muted)]">
              Vol. I &mdash; Field notes on captioning
            </div>
          </div>

          <div className="flex flex-col gap-5 max-w-4xl">
            <h1 className="display text-[2.4rem] md:text-[4.25rem] leading-[0.95] tracking-[-0.045em] text-[color:var(--fg)] text-balance">
              Writing about the craft of making video readable.
            </h1>
            <p className="text-[1.05rem] md:text-[1.15rem] leading-8 text-[color:var(--fg-weak)] max-w-2xl">
              <span className="ital-label">
                Practical guides on animated captions, subtitle workflows,
                short-form repurposing, and brand-consistent video delivery.
              </span>{" "}
              Written for creators, agencies, and in-house video teams who ship
              at volume.
            </p>
          </div>
        </header>

        {lead ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
              <span className="inline-block w-6 h-px bg-[color:var(--accent-ink)]" />
              <span>Lead story</span>
            </div>
            <Link
              href={lead.href}
              className="group panel p-6 md:p-10 flex flex-col gap-6 md:flex-row md:gap-10 md:items-end transition-shadow"
            >
              <div className="flex-1 flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.9rem]">
                    {formatDate(lead.publishedTime)}
                  </span>
                  <span>{lead.readingTime}</span>
                </div>
                <h2 className="display text-[1.9rem] md:text-[3rem] leading-[1] tracking-[-0.04em] text-[color:var(--fg)] text-balance group-hover:text-[color:var(--accent-ink)] transition-colors">
                  {lead.title}
                </h2>
                <p className="text-[1rem] md:text-[1.05rem] leading-8 text-[color:var(--fg-weak)] max-w-2xl">
                  {lead.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {lead.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-[0.72rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] bg-[color:var(--surface-2)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:w-56 flex md:flex-col md:items-end md:text-right gap-2 text-[color:var(--muted)]">
                <div className="ital-label text-[0.9rem]">
                  Read the feature
                </div>
                <div
                  aria-hidden
                  className="display text-[3rem] md:text-[4.5rem] leading-none text-[color:var(--accent-ink)] tracking-[-0.04em] transition-transform group-hover:translate-x-1"
                >
                  &rarr;
                </div>
              </div>
            </Link>
          </section>
        ) : null}

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              <span>Explore by cluster</span>
              <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.85rem]">
                {String(clusters.length).padStart(2, "0")} clusters
              </span>
            </div>
            <Link
              href="/blog/page/1"
              className="text-[0.78rem] font-semibold text-[color:var(--accent-ink)] inline-flex items-center gap-1.5"
            >
              Browse archive
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {clusters.map((cluster) => (
              <Link
                key={cluster.slug}
                href={`/blog/cluster/${cluster.slug}`}
                className="group panel p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <span>{cluster.title}</span>
                  <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
                    {String(cluster.count).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="display text-[1.35rem] md:text-[1.55rem] leading-[1.08] tracking-[-0.03em] text-[color:var(--fg)] text-balance group-hover:text-[color:var(--accent-ink)] transition-colors">
                  {cluster.pillar.title}
                </h2>
                <p className="ital-label text-[0.98rem] leading-7 text-[color:var(--fg-weak)]">
                  {cluster.shortDescription}
                </p>
                <div className="flex items-center gap-2 text-[0.8rem] font-semibold text-[color:var(--accent-ink)]">
                  Open cluster
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              <span>Recent reads</span>
              <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.85rem]">
                {String(recent.length).padStart(2, "0")} articles
              </span>
            </div>
            <Link
              href="/blog/all"
              className="text-[0.78rem] font-semibold text-[color:var(--accent-ink)] inline-flex items-center gap-1.5"
            >
              Search all
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {recent.map((post, index) => (
              <article
                key={post.slug}
                className="group panel p-6 md:p-7 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
                    No. {String(index + 2).padStart(2, "0")}
                  </span>
                  <span>{post.readingTime}</span>
                </div>

                <h3 className="display text-[1.35rem] md:text-[1.55rem] leading-[1.1] tracking-[-0.03em] text-[color:var(--fg)] text-balance">
                  <Link
                    href={post.href}
                    className="group-hover:text-[color:var(--accent-ink)] transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>

                <p className="ital-label text-[1rem] leading-7 text-[color:var(--fg-weak)]">
                  {post.excerpt}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[color:var(--border)]">
                  <div className="text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    {formatDate(post.publishedTime)}
                  </div>
                  <Link
                    href={post.href}
                    className="text-[0.8rem] font-semibold text-[color:var(--accent-ink)] inline-flex items-center gap-1.5"
                    aria-label={`Read ${post.title}`}
                  >
                    Read
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      &rarr;
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
              Try {siteConfig.shortName}
            </div>
            <h2 className="display text-[1.5rem] md:text-[1.9rem] leading-[1.05] tracking-[-0.03em] text-[color:var(--fg)] text-balance">
              Turn what you just read into captions you can ship today.
            </h2>
            <p className="ital-label text-[0.98rem] leading-7 text-[color:var(--fg-weak)]">
              Upload a clip, align your script, and export subtitles in minutes.
            </p>
          </div>
          <Link
            href={getStudioHref("blog_index")}
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
