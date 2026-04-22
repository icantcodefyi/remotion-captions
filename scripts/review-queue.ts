import fs from "node:fs";
import path from "node:path";

const RUN_LOG_PATH = path.join(process.cwd(), "data", "run.log.jsonl");

function main() {
  if (!fs.existsSync(RUN_LOG_PATH)) {
    console.log("No run log found.");
    return;
  }

  const latest = new Map();

  for (const line of fs
    .readFileSync(RUN_LOG_PATH, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)) {
    const record = JSON.parse(line);
    latest.set(record.slug, record);
  }

  const queue = [...latest.values()].filter((record) =>
    ["generated", "dry_run"].includes(record.outcome),
  );

  if (!queue.length) {
    console.log("No posts currently waiting in the review queue.");
    return;
  }

  console.log("Posts queued for review:\n");
  for (const record of queue) {
    console.log(
      `- ${record.slug} (${record.cluster}) · ${record.mode} · ${record.filePath}`,
    );
  }
}

main();
