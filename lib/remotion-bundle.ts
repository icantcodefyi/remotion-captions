import path from "node:path";
import { bundle } from "@remotion/bundler";

let cachedServeUrl: Promise<string> | null = null;

export function getServeUrl(): Promise<string> {
  if (!cachedServeUrl) {
    const projectRoot = process.cwd();
    cachedServeUrl = bundle({
      entryPoint: path.join(projectRoot, "remotion", "index.ts"),
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config.resolve?.alias ?? {}),
            "@": projectRoot,
          },
        },
      }),
      onProgress: (progress) => {
        if (progress % 10 === 0) {
          console.log(`[remotion-bundle] ${progress}%`);
        }
      },
    }).catch((err) => {
      cachedServeUrl = null;
      throw err;
    });
  }
  return cachedServeUrl;
}
