import { ensureBrowser } from "@remotion/renderer";

async function main() {
  console.log("[remotion] Ensuring Chrome headless shell is installed…");
  const start = Date.now();
  await ensureBrowser();
  console.log(
    `[remotion] Done in ${((Date.now() - start) / 1000).toFixed(1)}s`,
  );
}

main().catch((err) => {
  console.error("[remotion] Failed to ensure browser:", err);
  process.exit(1);
});
