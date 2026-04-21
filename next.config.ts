import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@deepgram/sdk"],
  typedRoutes: false,
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
};

export default nextConfig;
