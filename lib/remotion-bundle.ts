import { existsSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";

const projectRoot = process.cwd();
const PREBUILT_DIR = path.join(projectRoot, ".remotion-bundle");
const ENTRY_POINT = path.join(projectRoot, "remotion", "index.ts");

type BundleProgressListener = (progress: number) => void;

const globalForRemotion = globalThis as typeof globalThis & {
  __remotionServeUrl?: Promise<string> | null;
  __remotionBundleProgress?: number;
  __remotionBundleSubscribers?: Set<BundleProgressListener>;
};

const bundleSubscribers =
  globalForRemotion.__remotionBundleSubscribers ??
  (globalForRemotion.__remotionBundleSubscribers =
    new Set<BundleProgressListener>());

if (typeof globalForRemotion.__remotionBundleProgress !== "number") {
  globalForRemotion.__remotionBundleProgress = 0;
}

function emitBundleProgress(progress: number) {
  globalForRemotion.__remotionBundleProgress = progress;
  for (const listener of bundleSubscribers) listener(progress);
}

export function subscribeToBundleProgress(listener: BundleProgressListener) {
  bundleSubscribers.add(listener);
  listener(globalForRemotion.__remotionBundleProgress ?? 0);
  return () => {
    bundleSubscribers.delete(listener);
  };
}

function prebuiltExists() {
  return (
    existsSync(path.join(PREBUILT_DIR, "index.html")) ||
    existsSync(path.join(PREBUILT_DIR, "bundle.js"))
  );
}

export function getServeUrl(): Promise<string> {
  const cached = globalForRemotion.__remotionServeUrl;
  if (cached) return cached;

  if (prebuiltExists()) {
    emitBundleProgress(100);
    const promise = Promise.resolve(PREBUILT_DIR);
    globalForRemotion.__remotionServeUrl = promise;
    return promise;
  }

  emitBundleProgress(0);
  const promise = bundle({
    entryPoint: ENTRY_POINT,
    outDir: PREBUILT_DIR,
    enableCaching: true,
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
      emitBundleProgress(progress);
      if (progress % 10 === 0) {
        console.log(`[remotion-bundle] ${progress}%`);
      }
    },
  })
    .then((url) => {
      emitBundleProgress(100);
      return url;
    })
    .catch((err) => {
      globalForRemotion.__remotionServeUrl = null;
      emitBundleProgress(0);
      throw err;
    });

  globalForRemotion.__remotionServeUrl = promise;
  return promise;
}
