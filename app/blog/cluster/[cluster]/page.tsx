import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllClusters,
  getCluster,
  getClusterPillar,
  getPostsByCluster,
} from "@/lib/posts";
import { getStudioHref, siteConfig } from "@/lib/site";

type PageProps = {
  params: Promise<{ cluster: string }>;
};

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllClusters().map((cluster) => ({
    cluster: cluster.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { cluster: clusterSlug } = await params;

  try {
    const cluster = getCluster(clusterSlug);

    return {
      title: cluster.title,
      description: cluster.description,
      alternates: {
        canonical: `/blog/cluster/${cluster.slug}`,
      },
      openGraph: {
        title: `${cluster.title} | ${siteConfig.name} Journal`,
        description: cluster.description,
        url: `/blog/cluster/${cluster.slug}`,
      },
    };
  } catch {
    return {};
  }
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogClusterPage({ params }: PageProps) {
  const { cluster: clusterSlug } = await params;

  let cluster;
  try {
    cluster = getCluster(clusterSlug);
  } catch {
    notFound();
  }

  const pillar = getClusterPillar(cluster.slug);
  const posts = getPostsByCluster(cluster.slug);

  if (!pillar) {
    notFound();
  }

  const spokePosts = posts.filter((post) => post.slug !== pillar.slug);

  return (
    <main className="relative px-4 md:px-6 py-10 md:py-14">
      <div className="mx-auto max-w-6xl flex flex-col gap-10 md:gap-14">
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
            <span className="text-[color:var(--fg)]">{cluster.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8 border-b border-[color:var(--border)] pb-8">
            <div className="flex flex-col gap-4 max-w-4xl">
              <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                <span className="inline-block w-6 h-px bg-[color:var(--accent-ink)]" />
                <span>Cluster</span>
              </div>
              <h1 className="display text-[2.2rem] md:text-[3.8rem] leading-[0.96] tracking-[-0.045em] text-[color:var(--fg)] text-balance">
                {cluster.title}
              </h1>
              <p className="ital-label text-[1.02rem] md:text-[1.15rem] leading-8 text-[color:var(--fg-weak)] max-w-3xl">
                {cluster.description}
              </p>
            </div>

            <aside className="panel p-5 flex flex-col gap-3">
              <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Designed for
              </div>
              <p className="text-[0.98rem] leading-7 text-[color:var(--fg)]">
                {cluster.audience}
              </p>
              <div className="pt-3 border-t border-[color:var(--border)] flex items-center justify-between text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                <span>Articles</span>
                <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.92rem]">
                  {String(posts.length).padStart(2, "0")}
                </span>
              </div>
            </aside>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 md:gap-8">
          <Link
            href={pillar.href}
            className="group panel p-6 md:p-8 flex flex-col gap-5"
          >
            <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
              <span>Pillar guide</span>
              <span>{pillar.readingTime}</span>
            </div>
            <h2 className="display text-[1.8rem] md:text-[2.4rem] leading-[1.02] tracking-[-0.04em] text-[color:var(--fg)] group-hover:text-[color:var(--accent-ink)] transition-colors text-balance">
              {pillar.title}
            </h2>
            <p className="ital-label text-[1rem] md:text-[1.05rem] leading-8 text-[color:var(--fg-weak)] max-w-2xl">
              {pillar.excerpt}
            </p>
            <div className="flex items-center gap-2 text-[0.8rem] font-semibold text-[color:var(--accent-ink)]">
              Read the pillar
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </div>
          </Link>

          <aside className="panel p-5 flex flex-col gap-4">
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Archive paths
            </div>
            <Link
              href="/blog/page/1"
              className="text-[0.92rem] leading-6 text-[color:var(--fg)] hover:text-[color:var(--accent-ink)] transition-colors"
            >
              Browse the paginated archive
            </Link>
            <Link
              href="/blog/all"
              className="text-[0.92rem] leading-6 text-[color:var(--fg)] hover:text-[color:var(--accent-ink)] transition-colors"
            >
              Search the full index
            </Link>
            <Link
              href={getStudioHref(`cluster_${cluster.slug}`)}
              className="text-[0.92rem] leading-6 text-[color:var(--fg)] hover:text-[color:var(--accent-ink)] transition-colors"
            >
              Open the studio
            </Link>
          </aside>
        </section>

        {spokePosts.length ? (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
              <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                <span>Supporting reads</span>
                <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.85rem]">
                  {String(spokePosts.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {spokePosts.map((post) => (
                <article
                  key={post.slug}
                  className="group panel p-6 md:p-7 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
                      {formatDate(post.publishedTime)}
                    </span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h2 className="display text-[1.35rem] md:text-[1.55rem] leading-[1.1] tracking-[-0.03em] text-[color:var(--fg)] text-balance">
                    <Link
                      href={post.href}
                      className="group-hover:text-[color:var(--accent-ink)] transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="ital-label text-[1rem] leading-7 text-[color:var(--fg-weak)]">
                    {post.excerpt}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
