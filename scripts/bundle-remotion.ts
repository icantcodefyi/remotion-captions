import path from "node:path";
import { bundle } from "@remotion/bundler";

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, ".remotion-bundle");

async function main() {
  console.log("[bundle-remotion] Pre-bundling Remotion composition…");
  const start = Date.now();
  const serveUrl = await bundle({
    entryPoint: path.join(projectRoot, "remotion", "index.ts"),
    outDir,
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
      if (progress % 10 === 0) {
        console.log(`[bundle-remotion] ${progress}%`);
      }
    },
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[bundle-remotion] Done in ${elapsed}s → ${serveUrl}`);
}

main().catch((err) => {
  console.error("[bundle-remotion] Failed:", err);
  process.exit(1);
});
