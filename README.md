# Caption Studio

A Remotion-powered web app for generating beautiful captions for any video.

## Features

- Drop any video or audio file
- Transcribe with Deepgram Nova-3 (word-level timestamps)
- Optionally paste a script — we align your exact words to the audio timing
- 8 premium caption styles (TikTok, Hormozi, Beast, Karaoke, Minimal, Neon, Typewriter, Broadcast)
- Live Remotion preview with per-style customization
- Export as SRT or JSON

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000 and click **Add key** in the top-right to
paste your Deepgram key — it's stored in your browser's `localStorage` and
sent to the server only as a request header during transcription. No
`.env.local` required. Get a free key at https://console.deepgram.com.

If you'd rather set a server-side default (e.g. for shared deployments),
you can still export `DEEPGRAM_API_KEY` as an env var — it's used as a
fallback when the client doesn't supply a header.

## How it works

- `@remotion/player` renders a live preview of the composition in the browser
- `@remotion/captions` provides the Caption data shape and TikTok-style page grouping
- Caption styles are Remotion components that animate with `useCurrentFrame`
- The server route POSTs your video to Deepgram and returns a `Caption[]` JSON
- For the script mode, the server runs a Needleman-Wunsch alignment between script
  tokens and transcript tokens, then interpolates timings for any unmatched words
