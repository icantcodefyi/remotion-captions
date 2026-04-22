import type { Metadata } from "next";
import { ChangelogPage } from "@/components/pages/changelog-page";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See every major MeowCap capability in one place, from subtitle import and waveform editing to live styling, translation, and final video export.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: `${siteConfig.name} Changelog`,
    description:
      "The current feature surface of MeowCap, documented as a proper changelog.",
    url: "/changelog",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} Changelog`,
    description:
      "Subtitle import, waveform editing, brand kits, translation, and video export in one browser studio.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${siteConfig.name} changelog`,
  url: absoluteUrl("/changelog"),
  description:
    "A running overview of the features currently shipping in MeowCap.",
};

export default function ChangelogRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <ChangelogPage />
    </>
  );
}
