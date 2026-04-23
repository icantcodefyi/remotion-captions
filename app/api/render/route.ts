import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type { Caption } from "@remotion/captions";
import type { CaptionStyleId, StyleOptions } from "@/lib/types";
import type { ExportQuality } from "@/lib/video-export";
import {
  JOB_RETENTION_MS,
  STALE_JOB_THRESHOLD_MS,
  isProcessAlive,
  isTerminalState,
  isValidJobId,
  jobDirFor,
  readJobState,
  stateFileFor,
  writeJobConfig,
  writeJobState,
  cleanupJobDir,
  type JobConfig,
  type PersistedJobState,
} from "@/lib/render-job";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

type RenderBody = {
  captions: Caption[];
  styleId: CaptionStyleId;
  styleOptions: StyleOptions;
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
  format: "mp4" | "webm";
};

const CODEC_BY_FORMAT: Record<RenderBody["format"], JobConfig["codec"]> = {
  mp4: "h264",
  webm: "vp8",
};

const globalForRender = globalThis as typeof globalThis & {
  __captionRenderSwept?: boolean;
};

export async function POST(req: NextRequest) {
  void sweepStaleJobsOnce();

  const form = await req.formData();
  const file = form.get("file");
  const propsRaw = form.get("props");
  const quality = resolveExportQuality(form.get("quality"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' upload." }, { status: 400 });
  }
  if (typeof propsRaw !== "string") {
    return NextResponse.json({ error: "Missing 'props' payload." }, { status: 400 });
  }

  let body: RenderBody;
  try {
    body = JSON.parse(propsRaw) as RenderBody;
  } catch {
    return NextResponse.json({ error: "Invalid 'props' JSON." }, { status: 400 });
  }

  const codec = CODEC_BY_FORMAT[body.format];
  if (!codec) {
    return NextResponse.json(
      { error: `Unsupported format: ${body.format}` },
      { status: 400 },
    );
  }

  const jobId = randomUUID();
  const jobDir = jobDirFor(jobId);
  await mkdir(jobDir, { recursive: true });

  const sourceExt = guessExtension(file.name, file.type);
  const sourcePath = path.join(jobDir, `source${sourceExt}`);
  const outputPath = path.join(
    jobDir,
    `output.${body.format === "mp4" ? "mp4" : "webm"}`,
  );

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(sourcePath, Buffer.from(arrayBuffer));

  const config: JobConfig = {
    jobId,
    sourcePath,
    outputPath,
    format: body.format,
    quality,
    codec,
    captions: body.captions,
    styleId: body.styleId,
    styleOptions: body.styleOptions,
    width: body.width,
    height: body.height,
    durationInFrames: body.durationInFrames,
    fps: body.fps,
  };
  await writeJobConfig(jobId, config);

  const initialState: PersistedJobState = {
    id: jobId,
    state: "queued",
    progress: {
      phase: "preparing",
      progress: 0.04,
      label: "Starting render worker…",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: body.durationInFrames,
    },
    outputPath: null,
    contentType: null,
    error: null,
    createdAt: Date.now(),
    workerPid: null,
  };
  await writeJobState(jobId, initialState);

  const workerScript = path.join(process.cwd(), "scripts", "render-worker.ts");
  const child = spawn(
    process.execPath,
    ["--experimental-transform-types", workerScript, jobId],
    {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
      cwd: process.cwd(),
      env: process.env,
    },
  );
  child.on("error", (err) => {
    console.error(`[render:${jobId}] spawn error`, err);
  });
  child.unref();

  if (child.pid) {
    await writeJobState(jobId, { ...initialState, workerPid: child.pid });
  }

  return NextResponse.json({ jobId });
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!jobId || !isValidJobId(jobId)) {
    return NextResponse.json(
      { error: "Missing or invalid 'jobId'." },
      { status: 400 },
    );
  }

  const state = await readJobStateWithStaleness(jobId);
  if (!state) {
    return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  }

  if (!download) {
    return NextResponse.json(toResponse(state));
  }

  if (state.state !== "completed" || !state.outputPath || !state.contentType) {
    return NextResponse.json(
      { error: "Render job is not ready for download." },
      { status: 409 },
    );
  }

  const rendered = await readFile(state.outputPath);
  const contentType = state.contentType;
  void cleanupJobDir(jobId);

  return new NextResponse(new Uint8Array(rendered), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(rendered.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId || !isValidJobId(jobId)) {
    return NextResponse.json(
      { error: "Missing or invalid 'jobId'." },
      { status: 400 },
    );
  }

  const state = await readJobState(jobId);
  if (!state) {
    return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  }

  if (state.workerPid) {
    try {
      process.kill(state.workerPid, "SIGTERM");
    } catch {
      // already dead
    }
  }

  await writeJobState(jobId, {
    ...state,
    state: "cancelled",
    workerPid: null,
    progress: {
      ...state.progress,
      phase: "finalizing",
      label: "Cancelling render…",
    },
    error: "Render cancelled",
  });

  return NextResponse.json({ ok: true });
}

async function readJobStateWithStaleness(
  jobId: string,
): Promise<PersistedJobState | null> {
  const state = await readJobState(jobId);
  if (!state) return null;
  if (isTerminalState(state.state)) return state;

  const workerAlive = state.workerPid
    ? isProcessAlive(state.workerPid)
    : true;

  let mtime = 0;
  try {
    mtime = (await stat(stateFileFor(jobId))).mtimeMs;
  } catch {
    return state;
  }

  const stale = Date.now() - mtime > STALE_JOB_THRESHOLD_MS;

  if (!workerAlive || stale) {
    const reason = !workerAlive
      ? "Render worker died unexpectedly. Please try again."
      : "Render worker stopped responding. Please try again.";
    const failed: PersistedJobState = {
      ...state,
      state: "failed",
      workerPid: null,
      error: reason,
      progress: {
        ...state.progress,
        phase: "finalizing",
        label: "Render failed",
      },
    };
    await writeJobState(jobId, failed);
    return failed;
  }

  return state;
}

function toResponse(state: PersistedJobState) {
  return {
    id: state.id,
    state: state.state,
    progress: state.progress,
    error: state.error,
  };
}

function resolveExportQuality(raw: FormDataEntryValue | null): ExportQuality {
  if (raw === "high" || raw === "medium" || raw === "low") return raw;
  return "high";
}

function guessExtension(name: string, type: string) {
  const fromName = path.extname(name);
  if (fromName) return fromName;
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("webm")) return ".webm";
  if (type.includes("quicktime")) return ".mov";
  return ".mp4";
}

async function sweepStaleJobsOnce() {
  if (globalForRender.__captionRenderSwept) return;
  globalForRender.__captionRenderSwept = true;
  try {
    const entries = await readdir(tmpdir());
    for (const name of entries) {
      if (!name.startsWith("captions-")) continue;
      const jobId = name.slice("captions-".length);
      if (!isValidJobId(jobId)) continue;
      const jobDir = path.join(tmpdir(), name);
      const statePath = path.join(jobDir, "state.json");
      try {
        const raw = await readFile(statePath, "utf8");
        const parsed = JSON.parse(raw) as PersistedJobState;
        const { mtimeMs } = await stat(statePath);
        const age = Date.now() - mtimeMs;
        const terminal = isTerminalState(parsed.state);
        const workerAlive = isProcessAlive(parsed.workerPid);
        if (terminal && age > JOB_RETENTION_MS) {
          await rm(jobDir, { recursive: true, force: true }).catch(
            () => undefined,
          );
        } else if (!terminal && !workerAlive && age > STALE_JOB_THRESHOLD_MS) {
          await rm(jobDir, { recursive: true, force: true }).catch(
            () => undefined,
          );
        }
      } catch {
        // unrelated dir or unreadable state; ignore
      }
    }
  } catch {
    // tmpdir unreadable; ignore
  }
}

