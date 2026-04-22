"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { BlogSearchEntry } from "@/lib/posts-schema";

type SortMode = "newest" | "oldest" | "shortest" | "longest";

type Props = {
  posts: BlogSearchEntry[];
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readingMinutes(label: string) {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function BlogArchive({ posts }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const keyword of post.keywords) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const matched = posts.filter((post) => {
      if (activeTag && !post.keywords.includes(activeTag)) return false;
      if (!needle) return true;
      return (
        post.title.toLowerCase().includes(needle) ||
        post.description.toLowerCase().includes(needle) ||
        post.excerpt.toLowerCase().includes(needle) ||
        post.primaryKeyword.toLowerCase().includes(needle) ||
        post.cluster.toLowerCase().includes(needle) ||
        post.keywords.some((k) => k.toLowerCase().includes(needle))
      );
    });

    const sorted = [...matched];
    switch (sort) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.publishedTime).getTime() -
            new Date(a.publishedTime).getTime(),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.publishedTime).getTime() -
            new Date(b.publishedTime).getTime(),
        );
        break;
      case "shortest":
        sorted.sort(
          (a, b) => readingMinutes(a.readingTime) - readingMinutes(b.readingTime),
        );
        break;
      case "longest":
        sorted.sort(
          (a, b) => readingMinutes(b.readingTime) - readingMinutes(a.readingTime),
        );
        break;
    }
    return sorted;
  }, [posts, deferredQuery, sort, activeTag]);

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "shortest", label: "Shortest" },
    { value: "longest", label: "Longest" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 panel p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <div className="relative flex-1">
            <span
              aria-hidden
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)] text-[0.82rem] uppercase tracking-[0.18em]"
            >
              Search
            </span>
            <input
              id="blog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'script alignment', 'podcast', 'tiktok'..."
              className="w-full h-12 pl-[5.5rem] pr-4 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[0.95rem] text-[color:var(--fg)] placeholder:text-[color:var(--muted-soft)] focus:border-[color:var(--accent-edge)] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] overflow-x-auto">
            {sortOptions.map((opt) => {
              const active = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-3 py-2 rounded-[12px] text-[0.78rem] uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[color:var(--surface-1)] text-[color:var(--fg)] shadow-[var(--shadow-soft)]"
                      : "text-[color:var(--muted)] hover:text-[color:var(--fg)]"
                  }`}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {tags.length ? (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[color:var(--border)]">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-[0.72rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md border transition-colors ${
                activeTag === null
                  ? "border-[color:var(--accent-edge)] bg-[color:var(--accent-soft)] text-[color:var(--accent-ink)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-[color:var(--fg)]"
              }`}
              aria-pressed={activeTag === null}
            >
              All topics
            </button>
            {tags.map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className={`text-[0.72rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md border transition-colors inline-flex items-center gap-2 ${
                    active
                      ? "border-[color:var(--accent-edge)] bg-[color:var(--accent-soft)] text-[color:var(--accent-ink)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-[color:var(--fg)]"
                  }`}
                  aria-pressed={active}
                >
                  <span>{tag}</span>
                  <span className="tnum-serif not-italic text-[0.72rem] opacity-70">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3 text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
        <div className="flex items-center gap-3">
          <span>Showing</span>
          <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
            {String(filtered.length).padStart(2, "0")}
          </span>
          <span>of {String(posts.length).padStart(2, "0")}</span>
        </div>
        {(query || activeTag) && (
          <button
            onClick={() => {
              setQuery("");
              setActiveTag(null);
            }}
            className="text-[color:var(--accent-ink)] uppercase tracking-[0.16em] text-[0.72rem] font-semibold"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-10 text-center flex flex-col gap-3 items-center">
          <div className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            No matches
          </div>
          <p className="ital-label text-[1.05rem] text-[color:var(--fg-weak)] max-w-md">
            Nothing in the archive fits that filter. Try a broader term or
            clear the filters to browse everything.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {filtered.map((post, index) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block py-6 md:py-7 border-b border-[color:var(--border)] hover:bg-[color:var(--surface-1)] transition-colors -mx-2 px-2 md:-mx-4 md:px-4 rounded-lg"
              >
                <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-8">
                  <div className="flex items-baseline gap-4 md:w-40 shrink-0">
                    <span
                      aria-hidden
                      className="tnum-serif not-italic text-[color:var(--muted)] text-[0.85rem]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="tnum-serif not-italic text-[color:var(--fg)] text-[0.88rem]">
                      {formatDate(post.publishedTime)}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <h3 className="display text-[1.25rem] md:text-[1.55rem] leading-[1.15] tracking-[-0.03em] text-[color:var(--fg)] group-hover:text-[color:var(--accent-ink)] transition-colors text-balance">
                      {post.title}
                    </h3>
                    <p className="ital-label text-[0.98rem] leading-7 text-[color:var(--fg-weak)] line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="text-[0.68rem] uppercase tracking-[0.12em] px-2 py-0.5 rounded text-[color:var(--muted)] bg-[color:var(--surface-2)] border border-[color:var(--border)]"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--muted)] md:w-28 md:justify-end md:text-right shrink-0">
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
      )}
    </div>
  );
}
