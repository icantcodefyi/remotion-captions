import Link from "next/link";
import {
  changelogFeatureCount,
  changelogFeatureGroups,
  changelogReleases,
  changelogStats,
} from "@/lib/changelog";
import { siteConfig } from "@/lib/site";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ChangelogPage() {
  return (
    <main className="relative px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:gap-14">
        <header className="flex flex-col gap-7 border-b border-[color:var(--border)] pb-8 md:pb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              <Link
                href="/"
                className="transition-colors hover:text-[color:var(--fg)]"
              >
                {siteConfig.shortName}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-[color:var(--fg)]">Changelog</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-edge)] bg-[color:var(--accent-soft)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-ink)]">
              <span>Current pass</span>
              <span className="tnum-serif">Apr 22, 2026</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
                <span className="inline-block h-px w-8 bg-[color:var(--accent-ink)]" />
                <span>Studio notes</span>
              </div>
              <h1 className="display max-w-4xl text-balance text-[2.65rem] leading-[0.94] tracking-[-0.05em] text-[color:var(--fg)] md:text-[4.75rem]">
                Everything MeowCap can do right now.
              </h1>
              <p className="max-w-3xl text-pretty text-[1.02rem] leading-8 text-[color:var(--fg-weak)] md:text-[1.12rem]">
                <span className="ital-label">
                  No mystery box, no hidden power user menu.
                </span>{" "}
                This page is the honest surface area of the product today:
                caption generation, subtitle import, waveform editing, live
                styling, multilingual translation, and final video export in
                one browser-based studio.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full border border-[color:var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[0.75rem] font-medium text-[color:var(--fg)]">
                  {changelogFeatureCount} current capabilities
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[0.75rem] font-medium text-[color:var(--fg)]">
                  In-app preview and export
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-[var(--surface-1)] px-3 py-1 text-[0.75rem] font-medium text-[color:var(--fg)]">
                  Built for short-form creators
                </span>
              </div>
            </div>

            <aside className="panel flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3">
                <div>
                  <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    At a glance
                  </div>
                  <div className="ital-label mt-1 text-[0.82rem] text-[color:var(--muted)]">
                    The current studio in numbers.
                  </div>
                </div>
                <div className="display text-[2.3rem] leading-none tracking-[-0.05em] text-[color:var(--accent-ink)]">
                  {String(changelogFeatureCount).padStart(2, "0")}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {changelogStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)]/78 px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        {stat.label}
                      </span>
                      <span className="display tnum-serif text-[1.45rem] leading-none text-[color:var(--fg)]">
                        {stat.value}
                      </span>
                    </div>
                    <p className="mt-2 text-[0.8rem] leading-6 text-[color:var(--fg-weak)]">
                      {stat.note}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </header>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              <span>Recent additions</span>
              <span className="tnum-serif text-[0.86rem] text-[color:var(--fg)]">
                {String(changelogReleases.length).padStart(2, "0")} notes
              </span>
            </div>
            <div className="ital-label text-[0.82rem] text-[color:var(--muted)]">
              A tighter read on what changed lately.
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {changelogReleases.map((release, index) => (
              <article
                key={release.id}
                className="panel flex flex-col gap-5 p-6 md:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--border)] pb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      <span>{release.eyebrow}</span>
                      <span className="tnum-serif text-[0.9rem] text-[color:var(--fg)]">
                        {formatDate(release.date)}
                      </span>
                    </div>
                    <h2 className="display max-w-2xl text-balance text-[1.55rem] leading-[1.02] tracking-[-0.035em] text-[color:var(--fg)] md:text-[2rem]">
                      {release.title}
                    </h2>
                  </div>
                  <div className="display text-[2.3rem] leading-none tracking-[-0.05em] text-[color:var(--accent-ink)]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <p className="max-w-[66ch] text-[0.98rem] leading-8 text-[color:var(--fg-weak)]">
                  {release.summary}
                </p>

                <div className="grid gap-2.5">
                  {release.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)]/72 px-4 py-3 text-[0.86rem] leading-6 text-[color:var(--fg)]"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              <span>Feature index</span>
              <span className="tnum-serif text-[0.86rem] text-[color:var(--fg)]">
                {String(changelogFeatureGroups.length).padStart(2, "0")} pillars
              </span>
            </div>
            <div className="ital-label text-[0.82rem] text-[color:var(--muted)]">
              Grouped by the job users are trying to get done.
            </div>
          </div>

          <div className="flex flex-col">
            {changelogFeatureGroups.map((group, index) => (
              <article
                key={group.id}
                className="grid gap-5 border-b border-[color:var(--border)] py-6 last:border-b-0 md:gap-6 lg:grid-cols-[88px_minmax(0,0.82fr)_minmax(0,1.08fr)] lg:items-start"
              >
                <div className="display tnum-serif text-[2rem] leading-none tracking-[-0.05em] text-[color:var(--accent-ink)] md:text-[2.5rem]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    {group.eyebrow}
                  </div>
                  <h2 className="display text-balance text-[1.35rem] leading-[1.05] tracking-[-0.03em] text-[color:var(--fg)] md:text-[1.7rem]">
                    {group.title}
                  </h2>
                  <p className="max-w-[38ch] text-[0.92rem] leading-7 text-[color:var(--fg-weak)]">
                    {group.description}
                  </p>
                </div>

                <div className="grid gap-2.5">
                  {group.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface-1)] px-4 py-3 text-[0.87rem] leading-6 text-[color:var(--fg)] shadow-[var(--shadow-soft)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-3">
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--accent-ink)]">
              Back to work
            </div>
            <h2 className="display max-w-2xl text-balance text-[1.8rem] leading-[1] tracking-[-0.04em] text-[color:var(--fg)] md:text-[2.4rem]">
              The point of the changelog is confidence, not ceremony.
            </h2>
            <p className="max-w-[62ch] text-[0.96rem] leading-8 text-[color:var(--fg-weak)]">
              If you are holding a short-form clip and wondering whether
              MeowCap can handle it, this page should answer that in one pass.
              The next step is to drop a file in and make the captions behave.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[color:var(--accent-edge)] bg-[var(--accent)] px-4 text-[0.84rem] font-semibold text-[color:var(--accent-deep)] shadow-[0_8px_22px_-12px_var(--accent-glow),inset_0_1px_0_oklch(100%_0_0/0.35)] transition-[transform,filter] duration-200 ease-[var(--ease-out-soft)] hover:brightness-[1.03]"
            >
              Open the studio
            </Link>
            <Link
              href="/blog"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[var(--surface-1)] px-4 text-[0.84rem] font-semibold text-[color:var(--fg)] shadow-[var(--shadow-soft)] transition-colors duration-200 hover:bg-[var(--surface-2)]"
            >
              Read the journal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
