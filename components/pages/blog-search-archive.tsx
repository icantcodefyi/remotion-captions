"use client";

import { startTransition, useEffect, useState } from "react";
import type { BlogSearchEntry } from "@/lib/posts-schema";
import { BlogArchive } from "@/components/pages/blog-archive";

type Props = {
  indexUrl: string;
};

export function BlogSearchArchive({ indexUrl }: Props) {
  const [posts, setPosts] = useState<BlogSearchEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(indexUrl, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Search index request failed with ${response.status}.`);
        }

        const payload = (await response.json()) as { posts: BlogSearchEntry[] };

        if (!cancelled) {
          startTransition(() => {
            setPosts(payload.posts);
            setError(null);
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load the search index.",
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [indexUrl]);

  if (error) {
    return (
      <div className="panel p-10 text-center flex flex-col gap-3 items-center">
        <div className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Search unavailable
        </div>
        <p className="ital-label text-[1.05rem] text-[color:var(--fg-weak)] max-w-md">
          The archive index did not load cleanly. Refresh the page and try
          again.
        </p>
        <p className="text-[0.82rem] text-[color:var(--muted)] max-w-md">
          {error}
        </p>
      </div>
    );
  }

  if (!posts) {
    return (
      <div className="panel p-10 text-center flex flex-col gap-3 items-center">
        <div className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Loading index
        </div>
        <p className="ital-label text-[1.05rem] text-[color:var(--fg-weak)] max-w-md">
          Pulling the full archive into the client-side search index.
        </p>
      </div>
    );
  }

  return <BlogArchive posts={posts} />;
}
