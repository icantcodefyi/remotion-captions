import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import { getOgFonts, OG_PALETTE } from "@/lib/og-fonts";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

export default async function OpenGraphImage() {
  const fonts = await getOgFonts();
  const p = OG_PALETTE;

  const chips = [
    { text: "made", active: false },
    { text: "in", active: false },
    { text: "the", active: false },
    { text: "browser", active: true },
  ];

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
            <span style={{ display: "flex" }}>a caption studio</span>
            <span
              style={{
                display: "flex",
                width: 5,
                height: 5,
                borderRadius: 999,
                background: p.inkMuted,
              }}
            />
            <span style={{ display: "flex" }}>est. 2026</span>
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
            marginTop: 72,
            gap: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Display",
              fontWeight: 700,
              fontSize: 140,
              lineHeight: 0.94,
              letterSpacing: "-0.05em",
              color: p.ink,
            }}
          >
            <span style={{ display: "flex" }}>Captions that</span>
            <span
              style={{
                display: "flex",
                alignItems: "baseline",
                fontFamily: "Italic",
                fontStyle: "italic",
                fontWeight: 500,
                color: p.limeDeep,
                letterSpacing: "-0.035em",
                marginTop: 4,
              }}
            >
              purr.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Body",
              fontSize: 28,
              lineHeight: 1.38,
              color: p.inkSoft,
              maxWidth: 880,
              letterSpacing: "-0.003em",
            }}
          >
            A browser caption studio for short-form video. Transcribe clips,
            align scripts, preview eight Remotion styles, and export polished
            subtitles — all from the browser.
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Italic",
                fontStyle: "italic",
                fontSize: 17,
                color: p.inkMuted,
                letterSpacing: "0.02em",
              }}
            >
              a glimpse at the export —
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {chips.map((chip) => (
                <div
                  key={chip.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontFamily: "Display",
                    fontWeight: 700,
                    fontSize: 28,
                    letterSpacing: "-0.015em",
                    color: chip.active ? p.limeDeep : p.inkSoft,
                    background: chip.active ? p.lime : p.paperSurface,
                    border: chip.active
                      ? "1px solid transparent"
                      : `1px solid ${p.ruleSoft}`,
                    boxShadow: chip.active
                      ? `0 10px 26px ${p.limeGlow}`
                      : "0 1px 0 rgba(255,255,255,0.7) inset",
                  }}
                >
                  {chip.text}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "Italic",
                fontStyle: "italic",
                fontSize: 18,
                color: p.inkMuted,
              }}
            >
              <span style={{ display: "flex" }}>transcribe</span>
              <span
                style={{
                  display: "flex",
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: p.inkMuted,
                }}
              />
              <span style={{ display: "flex" }}>align</span>
              <span
                style={{
                  display: "flex",
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: p.inkMuted,
                }}
              />
              <span style={{ display: "flex" }}>style</span>
              <span
                style={{
                  display: "flex",
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: p.inkMuted,
                }}
              />
              <span style={{ display: "flex" }}>export</span>
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Display",
                fontWeight: 700,
                fontSize: 26,
                color: p.ink,
                letterSpacing: "-0.015em",
              }}
            >
              meowcap.app
            </div>
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
