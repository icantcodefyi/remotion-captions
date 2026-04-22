# Scaling the journal to 10,000 blog posts

A concrete, staged plan for using Codex (or any LLM agent) to generate,
validate, and ship ~10,000 SEO-targeted articles for MeowCap without
tanking site quality or getting flagged as spam by Google's Helpful
Content / SpamBrain systems.

Read this top-to-bottom once. Then work it as four gated stages:
**1) Infra**, **2) Keyword plan**, **3) Generation loop**,
**4) Publishing + monitoring**. Don't skip to stage 3.

---

## 0. The sober reality

Pumping 10k AI articles at a fresh domain is the single fastest way to
get de-indexed in 2026. Google's March 2024 core + spam update and the
follow-on updates through 2025 now explicitly target "scaled content
abuse" — programmatic publishing at volume with little original value.

What actually still works:

- **Topical authority.** Cover one niche (caption workflows for
  short-form video) exhaustively, not 50 niches shallowly.
- **First-hand signal.** Product screenshots from the real app, real
  examples with real timings, exported SRTs checked in as assets.
- **Editorial quality gate.** A human (or a separate LLM acting as an
  editor) must approve before publish. No "auto-push on generation."
- **Slow ramp.** 10k articles should be released across 6–12 months,
  not 30 days. A brand-new domain going from 4 to 10k URLs in a week is
  a manual action waiting to happen.

If any of the above makes you want to cut corners, stop here. The rest
of the plan assumes you're treating the corpus as a real publication.

---

## 1. Infra: make 10k posts actually buildable

The current `lib/seo-content.ts` holds posts in a single TypeScript
array. That breaks around 100–300 posts: slow IDE, slow typecheck,
giant server bundles because every static param ships through the RSC
graph.

### 1a. Move from TS array to file-per-post

Migrate to one of these — pick one, don't mix:

- **MDX + `fumadocs` / `next-mdx-remote`**: best if you want rich
  embeds (video, components) inside posts.
- **Flat `.md` + frontmatter + `gray-matter`**: simpler, faster builds,
  enough for 10k.
- **Content DB (SQLite/Turso/Neon)**: best if posts will be edited by
  non-engineers via a CMS and you want to paginate the archive.

Recommended for this codebase: **flat `.md` with frontmatter in
`content/blog/*.md`**. One file per slug. Load via a small reader in
`lib/posts.ts`.

Frontmatter schema (enforced with Zod):

```yaml
---
slug: animated-captions-for-tiktok-creators
title: "..."
description: "..."       # <= 155 chars, meta description
excerpt: "..."            # <= 220 chars, card text
publishedTime: 2026-05-01
updatedTime: 2026-05-01
readingTime: "7 min read"
cluster: creator-workflow
primaryKeyword: "tiktok caption generator"
keywords: ["tiktok caption generator", "animated tiktok captions", ...]
internalLinks: ["/blog/transcript-vs-subtitles-vs-closed-captions"]
status: draft | review | published
author: meowcap
---
```

### 1b. Sitemap chunking

Google accepts max 50,000 URLs or 50MB per sitemap file. 10k is fine in
one, but split by cluster (e.g. `/sitemap-creator.xml`,
`/sitemap-agency.xml`) so you can resubmit individual clusters if one
gets quality issues. Add a `sitemap-index.xml`.

Next.js lets you generate multiple sitemaps via `app/sitemap.ts`
returning the indexed variant. Update `app/robots.ts` to reference the
index, not individual files.

### 1c. Build time

10k MDX/MD files × SSG = slow builds. Two options:

- **Incremental Static Regeneration** (`export const revalidate = 86400`)
  with `dynamicParams = true`. Only builds hot pages; the long tail is
  rendered on first hit and cached.
- **Partial prerendering / Cache Components** (Next 16). Prerender the
  shell + TOC + header, stream the body. Works nicely for the blog
  layout we just shipped.

Pick ISR first — simpler. Move to PPR only if TTFB becomes a problem.

### 1d. Internal linking graph

This is 80% of the SEO value at scale and the thing an LLM loves to
get wrong. Before generating any post:

1. Define **clusters**: `creator-workflow`, `agency-ops`,
   `podcast-repurposing`, `accessibility`, `format-guides`,
   `platform-guides-tiktok`, `platform-guides-reels`, etc.
2. Each cluster has **one pillar post** (~3,000 words, broad) and 40–80
   **spoke posts** (~1,200–1,800 words, narrow long-tail).
3. Every spoke links **up** to its pillar, **sideways** to 2–3 other
   spokes in the same cluster, and **cross-cluster** to at most 1
   pillar in a different cluster.
4. Codex generates `internalLinks:` in frontmatter. A build-time
   validator rejects posts that violate the link rules.

### 1e. Design-side changes already in place

The redesigned `/blog` index already uses a lead story + archive grid.
At 10k posts the flat archive becomes unreadable — before you exceed
~200 posts, add:

- Cluster landing pages (`/blog/cluster/creator-workflow`).
- Paginated archive (`/blog/page/2`, etc.), `rel=next/prev` optional.
- Search (static client-side with `flexsearch` or `minisearch` over a
  prebuilt JSON index).

---

## 2. The keyword plan (do this before prompting Codex)

Do not ask Codex to "invent 10,000 blog topics." You'll get 10,000
variations of the same four posts.

### 2a. Harvest real queries

Sources, cheapest first:

- Google Search Console, once you have any traffic.
- Free: Google autocomplete scraping, People Also Ask, Reddit threads
  on r/Podcasting, r/NewTubers, r/socialmedia, r/VideoEditing.
- Paid: Ahrefs / Semrush / DataForSEO — pull every keyword with
  monthly search volume between 20 and 5,000 in the
  captions/subtitles/short-form space. Lower volume is *better* here
  — less competition, easier to rank, still converts.
- Competitor sitemaps: scrape sitemaps of
  descript.com/blog, submagic.co/blog, captions.ai, opus.pro,
  veed.io/blog. Use their URLs as topic seeds, never as templates.

Target output: a CSV of 15,000–20,000 candidate queries (you'll
filter down). Columns:

```
query, volume, difficulty, intent, cluster, pillar_slug, notes
```

### 2b. Classify intent

For each query, tag:

- `informational` (80% of the corpus) — "how to add captions to a
  TikTok"
- `comparison` (15%) — "submagic vs captions ai"
- `transactional` (5%) — "free tiktok caption generator"

Don't generate transactional posts until you actually have proof points
(screenshots, benchmarks). Comparison posts without real product use
are the biggest spam flag.

### 2c. Deduplicate by topic, not by string

`"add captions to tiktok video"` and
`"put subtitles on tiktok clips"` are the same article. Embed each
query with an embedding model, cluster at a tight cosine threshold
(~0.88), keep one representative per cluster with the highest volume.
This is how you get from 20k queries to ~10k distinct articles.

### 2d. Assign each query to a cluster + pillar

A spreadsheet, not a prompt. This is the single artifact you hand to
Codex later. Don't let Codex assign clusters — it will drift.

---

## 3. The generation loop

Now you can prompt.

### 3a. Prompt architecture

Do **not** use a single megaprompt. Use a pipeline of smaller prompts,
each with one job. Every stage's output is cheap to re-run.

Pipeline per post:

1. **Outline** (cheap model) — given `{keyword, cluster, pillar,
   siblings}`, produce a 6–9 section outline with angle, target
   reader, and one concrete example to include.
2. **Draft** (strong model) — given the outline + style guide + 3 real
   example posts, produce a full draft in the project's MD format.
3. **Editor pass** (strong model, separate invocation) — given the
   draft, rewrite for: Flesch reading ease >= 55, no LLM tells ("in
   today's fast-paced world", "delve", "tapestry"), varied sentence
   length, specific not generic.
4. **Fact + hallucination check** — extract every factual claim
   ("Instagram Reels max length", "TikTok caption char limit") into a
   list. Verify against a snapshot doc you maintain (`docs/facts.md`).
   Replace unverifiable claims with softer language.
5. **Frontmatter + link graph** — populate `internalLinks` from the
   cluster map (not invented). Generate `description`/`excerpt` from
   the body.
6. **Schema lint** — Zod-parse the frontmatter + word count + link
   validity. Fail closed.

Stage 1 + 2 can be Codex or any coding-focused agent. Stages 3–6
should be plain LLM calls; no tools needed.

### 3b. Style guide (feed this as system prompt to stages 2 and 3)

One file: `docs/blog-style.md`. Include:

- Voice: practical, declarative, written for video ops people. Not
  hypey. No exclamation marks. No em-dash constructions of three in a
  row.
- Banned words + phrases (full list, updated when you see LLM tells
  leak through). Start with: `delve, tapestry, in today's fast-paced,
  navigating the landscape, it's important to note, unleash, unlock,
  game-changer, seamless, revolutionize`.
- Paragraph length: 2–4 sentences. Max 4.
- Sections: 4–7 H2s, no H1 other than title, H3 only when a bullet
  list isn't enough.
- Opening paragraph: must name the reader by job, not generically. "If
  you run paid social for an agency" beats "in the world of video."
- End: concrete next step, linking to the studio or a sibling post.
- **Always include at least one example using the MeowCap flow** —
  paste real fixture text from a canonical transcript file
  (`docs/fixtures/transcript-sample-1.json`). This is the first-hand
  signal Google cares about.

### 3c. Throughput + cost

At 10k posts, stage 2 alone is the expensive one. Rough budget with
2026 pricing:

- Outline: ~800 input / ~400 output tokens per post × cheap model
- Draft: ~2.5k input / ~2.0k output tokens × strong model
- Editor: ~3.5k input / ~2.0k output tokens × strong model
- Verify/lint: cheap

Price the draft + editor stages against your preferred provider. At
common 2026 rates you're in the low four figures total — plan for
$2k–$5k of compute, not $50. If a quote comes back at $100, you're
using a too-small model and the output will show it.

Run the pipeline in batches of 50 posts in parallel. 10k / 50 = 200
batches. At ~90s per batch end-to-end, the full generation pass fits
in 5–6 hours of wall time.

### 3d. The Codex-specific harness

For Codex (or any coding agent):

1. Create `scripts/generate-posts.ts`.
2. It reads `data/keywords.csv` and `data/clusters.json`.
3. For each row with `status != published`, run the 6-stage pipeline,
   write the output to `content/blog/<slug>.md`, update a
   `data/run.log.jsonl` with per-post telemetry (model, tokens,
   validation failures, cost).
4. `status` lives in that log, not in the file, so re-runs are
   idempotent.
5. Add a `--limit N` flag so you can smoke-test on 10 posts first.
6. Add a `--cluster X` flag so you can backfill one cluster at a time.
7. Commit the generated markdown to git. This is both your CMS and
   your audit trail — if a post underperforms, `git blame` shows which
   pipeline version produced it.

### 3e. Human review gate

Non-negotiable. Before any post hits `status: published`:

- A human skims the title, lead paragraph, and first H2. 30 seconds
  per post. 10k × 30s ≈ 83 hours of reading time. Split across a team
  or across weeks. Yes, this is a lot; it's also the difference
  between a site that ranks and a site that gets manual-actioned.
- Automated checks that must pass first so humans only see plausible
  drafts: word count 1,100–2,200, no banned phrases, frontmatter
  valid, internal links resolve, no duplicate H2s, no repeated
  sentence across posts (run a near-dup check across the corpus with
  MinHash — LLMs love reusing phrases).

---

## 4. Publishing + monitoring

### 4a. Rollout schedule

Don't publish 10k on day one. Suggested curve:

- Month 1: publish 100. Submit to Search Console. Watch indexation.
- Month 2: publish 400 more (500 total). Check which cluster indexes
  fastest — double down there.
- Month 3–6: 1,500/month. By month 6 you're at ~5,500.
- Month 7–12: 750/month, now informed by Search Console query data.
  Kill topics that aren't indexing; expand topics that are.

Google's indexer budgets new-domain sites aggressively. If you publish
10k in a week, most will sit in "Discovered — currently not indexed"
for months. A slow ramp gets a higher indexation rate and a better
long-term ceiling.

### 4b. Internal traffic

Link to the blog from the app itself. High-signal users hitting the
blog from authenticated sessions is exactly the kind of engagement
that lifts a site out of the "AI spam" bucket. Add:

- A "Guides" link in the studio header.
- Contextual "Learn more about X" links next to relevant studio
  features — e.g. next to the script alignment control, link to the
  transcript alignment article.

### 4c. Observability

Track, per cluster and per post:

- Indexation state (GSC API)
- Impressions, clicks, avg position (GSC API)
- Time to index (publish time → first impression time)
- Outbound click-through to the studio (UTM on every CTA)
- "Helpful" heuristic: scroll depth + time on page. A post with <20s
  median time is probably thin; flag for rewrite.

Once a month, export a list of posts that:

- Have zero impressions after 60 days → queue for rewrite with a
  different angle, or `noindex` and delete.
- Rank position 8–20 → queue for expansion (add sections, more
  examples, fresher data) — this is the single highest-ROI action.

### 4d. When (not if) Google updates

Every Google core update, a subset of the 10k will drop. That's
normal. Don't panic-rewrite. Wait 2 weeks for the update to settle,
then look at which *clusters* dropped. If one cluster is hit
uniformly, the angle was wrong and rewrite the pillar first. If drops
are scattered, it's noise.

---

## 5. What to hand Codex as its first task

One discrete, testable slice — do not ask it to build the whole plan:

> **Task:** Implement the content-file migration from
> `lib/seo-content.ts` to `content/blog/*.md` with Zod-validated
> frontmatter.
>
> **Deliverables:**
> - `content/blog/` directory with one `.md` per existing post.
> - `lib/posts.ts` exporting `getAllPosts()`, `getPost(slug)`,
>   `getPostsByCluster(cluster)`, all typed.
> - `app/blog/page.tsx` and `app/blog/[slug]/page.tsx` updated to
>   consume `lib/posts.ts` instead of `lib/seo-content.ts`.
> - Schema in `lib/posts-schema.ts` (Zod).
> - No functional UI change — the visuals must match the current
>   redesign exactly.
>
> **Out of scope:** generation pipeline, clusters, sitemap chunking.
> Those are separate tasks.

Then, in order:

1. `scripts/generate-posts.ts` skeleton with the 6-stage pipeline,
   dry-run mode only.
2. Cluster + keyword data files.
3. Sitemap chunking.
4. First real generation batch (10 posts, one cluster).
5. Review loop and style-guide tuning.
6. Scale up.

Each task is 1–3 hours of Codex time. The whole thing is weeks of
work, not an afternoon. Treat it that way and the output is a real
publication; treat it like a weekend hack and it's an SEO tombstone.
