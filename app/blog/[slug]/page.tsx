import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHotPostSummaries,
  getPost,
  getRelatedPosts,
} from "@/lib/posts";
import type { BlogContentBlock } from "@/lib/posts-schema";
import {
  absoluteUrl,
  blogConfig,
  getStudioHref,
  siteConfig,
} from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Must stay a literal: Next segment config values need to be statically analyzable.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return getHotPostSummaries(blogConfig.hotStaticPostCount).map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post || post.status !== "published") {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedTime,
      modifiedTime: post.updatedTime,
      authors: [siteConfig.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function slugifyHeading(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return tokens.map((token, index) => {
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!linkMatch) {
      return token;
    }

    const [, label, href] = linkMatch;
    const isInternal = href.startsWith("/");

    if (isInternal) {
      return (
        <Link
          key={`${href}-${index}`}
          href={href}
          className="underline decoration-[color:var(--accent-edge)] underline-offset-4 hover:text-[color:var(--accent-ink)] transition-colors"
        >
          {label}
        </Link>
      );
    }

    return (
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-[color:var(--accent-edge)] underline-offset-4 hover:text-[color:var(--accent-ink)] transition-colors"
      >
        {label}
      </a>
    );
  });
}

function renderBlocks(
  blocks: BlogContentBlock[],
  leadSource: "intro" | "section",
  sectionIndex = 0,
) {
  return blocks.map((block, blockIndex) => {
    if (block.type === "subheading") {
      return (
        <h3
          key={`${block.heading}-${blockIndex}`}
          className="display text-[1.1rem] md:text-[1.25rem] leading-[1.2] tracking-[-0.02em] text-[color:var(--fg)] mt-2"
        >
          {block.heading}
        </h3>
      );
    }

    if (block.type === "list") {
      return (
        <ul key={`list-${blockIndex}`} className="mt-2 flex flex-col gap-2.5">
          {block.items.map((item, itemIndex) => (
            <li
              key={`${item}-${itemIndex}`}
              className="flex items-start gap-4 rounded-xl px-4 py-3.5 bg-[color:var(--surface-2)] border border-[color:var(--border)]"
            >
              <span className="tnum-serif not-italic text-[color:var(--accent-ink)] text-[0.8rem] pt-0.5 shrink-0">
                {String(itemIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.96rem] leading-7 text-[color:var(--fg)]">
                {renderInlineMarkdown(item)}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    const isLead =
      block.type === "paragraph" && blockIndex === 0 && sectionIndex === 0;

    return (
      <p
        key={`${block.text.slice(0, 32)}-${blockIndex}`}
        className={
          isLead && leadSource === "section"
            ? "ital-label text-[1.12rem] md:text-[1.18rem] leading-[1.75] text-[color:var(--fg)] text-pretty"
            : isLead && leadSource === "intro"
              ? "ital-label text-[1.12rem] md:text-[1.18rem] leading-[1.75] text-[color:var(--fg)] text-pretty"
              : "text-[1rem] leading-[1.8] text-[color:var(--fg-weak)] text-pretty"
        }
      >
        {renderInlineMarkdown(block.text)}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const related = getRelatedPosts(post.slug, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedTime,
    dateModified: post.updatedTime,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    url: absoluteUrl(`/blog/${post.slug}`),
    keywords: post.keywords.join(", "),
    articleSection: post.cluster.replace(/-/g, " "),
  };

  return (
    <main className="relative px-4 md:px-6 py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="mx-auto max-w-6xl flex flex-col gap-10 md:gap-14">
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
          <span className="text-[color:var(--fg)] truncate">{post.slug}</span>
        </nav>

        <header className="flex flex-col gap-6 border-b border-[color:var(--border)] pb-10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]"
              />
              <Link
                href={`/blog/cluster/${post.cluster}`}
                className="hover:text-[color:var(--fg)] transition-colors"
              >
                {post.cluster.replace(/-/g, " ")}
              </Link>
            </span>
            <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.9rem]">
              {formatDate(post.publishedTime)}
            </span>
            <span>{post.readingTime}</span>
          </div>

          <h1 className="display text-[2.2rem] md:text-[4rem] leading-[0.96] tracking-[-0.045em] text-[color:var(--fg)] text-balance max-w-5xl">
            {post.title}
          </h1>

          <p className="ital-label text-[1.1rem] md:text-[1.3rem] leading-8 text-[color:var(--fg-weak)] max-w-3xl text-pretty">
            {post.description}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {post.keywords.slice(0, 4).map((keyword) => (
              <span
                key={keyword}
                className="text-[0.72rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] bg-[color:var(--surface-2)]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-10 md:gap-14">
          <article className="flex flex-col gap-10 max-w-[68ch]">
            {post.intro.length ? (
              <section className="flex flex-col gap-5">
                {renderBlocks(post.intro, "intro", 0)}
              </section>
            ) : null}

            {post.sections.map((section, index) => {
              const id = slugifyHeading(section.heading);
              return (
                <section
                  key={section.heading}
                  id={id}
                  className="flex flex-col gap-4 scroll-mt-20"
                >
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="tnum-serif not-italic text-[color:var(--accent-ink)] text-[0.85rem]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className="flex-1 h-px bg-[color:var(--border)]"
                    />
                  </div>
                  <h2 className="display text-[1.5rem] md:text-[2rem] leading-[1.1] tracking-[-0.035em] text-[color:var(--fg)] text-balance">
                    {section.heading}
                  </h2>
                  <div className="flex flex-col gap-5">
                    {renderBlocks(
                      section.blocks,
                      post.intro.length ? "intro" : "section",
                      index,
                    )}
                  </div>
                </section>
              );
            })}

            <div className="mt-4 panel p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex flex-col gap-2 max-w-xl">
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
                  Put this into practice
                </div>
                <h3 className="display text-[1.35rem] md:text-[1.65rem] leading-[1.1] tracking-[-0.03em] text-[color:var(--fg)] text-balance">
                  Caption your next clip in {siteConfig.shortName}.
                </h3>
                <p className="ital-label text-[0.98rem] leading-7 text-[color:var(--fg-weak)]">
                  Transcribe, style, and export subtitles without opening an
                  editor.
                </p>
              </div>
              <Link
                href={getStudioHref(`blog_post_${post.slug}`)}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.88rem] font-semibold text-[color:var(--accent-deep)] bg-[color:var(--accent)] hover:brightness-[1.04] transition"
              >
                Open the studio
                <span aria-hidden>&rarr;</span>
              </Link>
            </div>
          </article>

          <aside className="hidden md:block">
            <div className="sticky top-8 flex flex-col gap-5">
              <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)] border-b border-[color:var(--border)] pb-3">
                In this piece
              </div>
              <ol className="flex flex-col gap-3">
                {post.sections.map((section, index) => {
                  const id = slugifyHeading(section.heading);
                  return (
                    <li key={id} className="flex gap-3">
                      <span
                        aria-hidden
                        className="tnum-serif not-italic text-[color:var(--muted)] text-[0.78rem] pt-0.5"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={`#${id}`}
                        className="text-[0.88rem] leading-6 text-[color:var(--fg-weak)] hover:text-[color:var(--accent-ink)] transition-colors text-balance"
                      >
                        {section.heading}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        </div>

        {related.length ? (
          <section className="flex flex-col gap-6 border-t border-[color:var(--border)] pt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                <span>Keep reading</span>
                <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.85rem]">
                  {String(related.length).padStart(2, "0")}
                </span>
              </div>
              <Link
                href="/blog/all"
                className="text-[0.8rem] font-semibold text-[color:var(--accent-ink)] inline-flex items-center gap-1.5"
              >
                All articles
                <span aria-hidden>&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group panel p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.85rem]">
                      {formatDate(item.publishedTime)}
                    </span>
                    <span>{item.readingTime}</span>
                  </div>
                  <h4 className="display text-[1.15rem] leading-[1.15] tracking-[-0.025em] text-[color:var(--fg)] text-balance group-hover:text-[color:var(--accent-ink)] transition-colors">
                    {item.title}
                  </h4>
                  <p className="ital-label text-[0.95rem] leading-7 text-[color:var(--fg-weak)]">
                    {item.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
