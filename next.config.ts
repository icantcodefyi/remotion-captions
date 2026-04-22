import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@deepgram/sdk"],
  typedRoutes: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
  outputFileTracingIncludes: {
    "/blog": ["./content/blog/**/*.md"],
    "/blog/**": ["./content/blog/**/*.md"],
    "/llms.txt": ["./content/blog/**/*.md"],
    "/llms-full.txt": ["./content/blog/**/*.md"],
    "/sitemap.xml": ["./content/blog/**/*.md"],
    "/sitemap-index.xml": ["./content/blog/**/*.md"],
  },
};

export default nextConfig;
