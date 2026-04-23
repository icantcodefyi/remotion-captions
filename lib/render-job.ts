import { mkdir, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Caption } from "@remotion/captions";
import type { CaptionStyleId, StyleOptions } from "./types";
import type { ExportProgress, ExportQuality } from "./video-export";

export const JOB_ID_PATTERN = /^[0-9a-f-]{36}$/i;
export const JOB_RETENTION_MS = 5 * 60 * 1000;
export const STALE_JOB_THRESHOLD_MS = 60_000;
export const HEARTBEAT_INTERVAL_MS = 5_000;
export const PERSIST_THROTTLE_MS = 400;

export type RenderJobState =
  | "queued"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

export type JobConfig = {
  jobId: string;
  sourcePath: string;
  outputPath: string;
  format: "mp4" | "webm";
  quality: ExportQuality;
  codec: "h264" | "vp8";
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
};

export type PersistedJobState = {
  id: string;
  state: RenderJobState;
  progress: ExportProgress;
  outputPath: string | null;
  contentType: string | null;
  error: string | null;
  createdAt: number;
  workerPid: number | null;
};

export function jobDirFor(jobId: string) {
  return path.join(tmpdir(), `captions-${jobId}`);
}

export function stateFileFor(jobId: string) {
  return path.join(jobDirFor(jobId), "state.json");
}

export function configFileFor(jobId: string) {
  return path.join(jobDirFor(jobId), "config.json");
}

export function isValidJobId(jobId: string) {
  return JOB_ID_PATTERN.test(jobId);
}

export function isTerminalState(state: RenderJobState) {
  return state === "completed" || state === "failed" || state === "cancelled";
}

export async function readJobState(
  jobId: string,
): Promise<PersistedJobState | null> {
  try {
    const raw = await readFile(stateFileFor(jobId), "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedJobState>;
    if (!parsed.id || parsed.id !== jobId || !parsed.state || !parsed.progress) {
      return null;
    }
    return {
      id: parsed.id,
      state: parsed.state,
      progress: parsed.progress,
      outputPath: parsed.outputPath ?? null,
      contentType: parsed.contentType ?? null,
      error: parsed.error ?? null,
      createdAt: parsed.createdAt ?? Date.now(),
      workerPid: parsed.workerPid ?? null,
    };
  } catch {
    return null;
  }
}

export async function writeJobState(jobId: string, state: PersistedJobState) {
  try {
    await mkdir(jobDirFor(jobId), { recursive: true });
    await writeFile(stateFileFor(jobId), JSON.stringify(state));
  } catch {
    // best-effort persistence; never fail the render for this
  }
}

export async function touchJobState(jobId: string) {
  try {
    const now = new Date();
    await utimes(stateFileFor(jobId), now, now);
  } catch {
    // state file may not exist yet; ignore
  }
}

export async function readJobConfig(jobId: string): Promise<JobConfig | null> {
  try {
    const raw = await readFile(configFileFor(jobId), "utf8");
    return JSON.parse(raw) as JobConfig;
  } catch {
    return null;
  }
}

export async function writeJobConfig(jobId: string, config: JobConfig) {
  await mkdir(jobDirFor(jobId), { recursive: true });
  await writeFile(configFileFor(jobId), JSON.stringify(config));
}

export async function cleanupJobDir(jobId: string) {
  await rm(jobDirFor(jobId), { recursive: true, force: true }).catch(
    () => undefined,
  );
}

export async function getStateMtime(jobId: string): Promise<number | null> {
  try {
    const { mtimeMs } = await stat(stateFileFor(jobId));
    return mtimeMs;
  } catch {
    return null;
  }
}

export function isProcessAlive(pid: number | null | undefined) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
