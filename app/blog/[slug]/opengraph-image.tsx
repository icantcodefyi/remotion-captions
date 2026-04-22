import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getHotPostSummaries, getPost } from "@/lib/posts";
import { siteConfig } from "@/lib/site";
import { getOgFonts, OG_PALETTE } from "@/lib/og-fonts";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = `${siteConfig.name} — field notes`;

export function generateStaticParams() {
  return getHotPostSummaries().map((post) => ({ slug: post.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function titleSizeFor(len: number) {
  if (len <= 40) return 104;
  if (len <= 55) return 90;
  if (len <= 70) return 78;
  if (len <= 90) return 68;
  return 60;
}

export default async function BlogOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const fonts = await getOgFonts();
  const p = OG_PALETTE;

  const titleSize = titleSizeFor(post.title.length);
  const publishedLabel = formatDate(post.publishedTime);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "54px 72px 56px",
          color: p.ink,
          fontFamily: "Body",
          background: `radial-gradient(980px 520px at 6% -14%, ${p.limeGlow}, transparent 52%), linear-gradient(180deg, ${p.paper} 0%, ${p.paperDeep} 100%)`,
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 260,
            height: 260,
            display: "flex",
            background: `radial-gradient(circle at 85% 15%, rgba(24,24,18,0.05), transparent 55%)`,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                background: p.lime,
                borderRadius: 4,
                boxShadow: `0 8px 18px ${p.limeGlow}`,
              }}
            />
            <div
              style={{
                display: "flex",
                fontFamily: "Display",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: p.ink,
              }}
            >
              {siteConfig.name}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "Italic",
              fontStyle: "italic",
              fontSize: 22,
              color: p.inkSoft,
            }}
          >
            <span style={{ display: "flex" }}>the field notes</span>
            <span
              style={{
                display: "flex",
                width: 5,
                height: 5,
                borderRadius: 999,
                background: p.inkMuted,
              }}
            />
            <span style={{ display: "flex" }}>{post.readingTime}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 1,
            marginTop: 22,
            background: p.rule,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
            gap: 22,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "Italic",
              fontStyle: "italic",
              fontSize: 22,
              color: p.limeDeep,
              letterSpacing: "0.01em",
            }}
          >
            <span
              style={{
                display: "flex",
                width: 28,
                height: 1,
                background: p.limeDeep,
              }}
            />
            <span style={{ display: "flex" }}>an essay on captions</span>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Display",
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              color: p.ink,
              maxWidth: 1060,
            }}
          >
            {post.title}
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Body",
              fontSize: 24,
              lineHeight: 1.42,
              color: p.inkSoft,
              maxWidth: 920,
              letterSpacing: "-0.003em",
              marginTop: 8,
            }}
          >
            {post.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 1,
            background: p.rule,
            marginBottom: 18,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "Italic",
              fontStyle: "italic",
              fontSize: 22,
              color: p.inkMuted,
            }}
          >
            <span style={{ display: "flex" }}>{post.readingTime}</span>
            <span
              style={{
                display: "flex",
                width: 5,
                height: 5,
                borderRadius: 999,
                background: p.inkMuted,
              }}
            />
            <span style={{ display: "flex" }}>{publishedLabel}</span>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Display",
              fontWeight: 700,
              fontSize: 24,
              color: p.ink,
              letterSpacing: "-0.015em",
            }}
          >
            meowcap.app/blog
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
