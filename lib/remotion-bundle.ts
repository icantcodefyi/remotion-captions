import path from "node:path";
import { bundle } from "@remotion/bundler";

let cachedServeUrl: Promise<string> | null = null;
let bundleProgress = 0;
const bundleSubscribers = new Set<(progress: number) => void>();

export function subscribeToBundleProgress(
  listener: (progress: number) => void,
) {
  bundleSubscribers.add(listener);
  listener(bundleProgress);
  return () => {
    bundleSubscribers.delete(listener);
  };
}

export function getServeUrl() {
  if (!cachedServeUrl) {
    bundleProgress = 0;
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
        bundleProgress = progress;
        for (const listener of bundleSubscribers) listener(progress);
        if (progress % 10 === 0) {
          console.log(`[remotion-bundle] ${progress}%`);
        }
      },
    })
      .then((url) => {
        bundleProgress = 100;
        for (const listener of bundleSubscribers) listener(100);
        return url;
      })
      .catch((err) => {
        cachedServeUrl = null;
        throw err;
      });
  }
  return cachedServeUrl;
}
