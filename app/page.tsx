import type { Metadata } from "next";
import { StudioPage } from "@/components/pages/studio-page";
import { homeFaqs } from "@/lib/seo-content";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "MeowCap",
  description:
    "Generate animated captions for short-form video with word-level timing, script alignment, live style previews, and subtitle exports.",
  keywords: [
    ...siteConfig.keywords,
    "caption editor",
    "animated subtitle generator",
    "short-form video captions",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteConfig.name} - AI Caption Generator for Short-Form Video`,
    description:
      "Generate animated captions with word-level timing, script alignment, and export-ready subtitle files.",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} homepage social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - AI Caption Generator for Short-Form Video`,
    description:
      "Generate animated captions with word-level timing, script alignment, and export-ready subtitle files.",
    images: ["/twitter-image"],
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    inLanguage: "en-US",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Word-level transcription timing",
      "Script alignment",
      "Animated caption style previews",
      "SRT export",
      "JSON export",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <StudioPage />
    </>
  );
}
