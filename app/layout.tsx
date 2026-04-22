import { type ReactNode } from "react";
import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Host_Grotesk,
  Spectral,
  JetBrains_Mono,
} from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { absoluteUrl, siteConfig } from "@/lib/site";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const body = Host_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const serif = Spectral({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} - AI Caption Generator for Short-Form Video`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} - AI Caption Generator for Short-Form Video`,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - AI Caption Generator for Short-Form Video`,
    description: siteConfig.description,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "video editing",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var stored = localStorage.getItem('meowcap-theme');
                  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.dataset.theme = theme;
                } catch (e) {
                  document.documentElement.dataset.theme = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <div className="paper-grain" aria-hidden />
        {children}
        <Toaster
          position="bottom-right"
          theme="system"
          closeButton
          toastOptions={{
            style: {
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              boxShadow: "var(--shadow-lift)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
