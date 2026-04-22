const cache = new Map<string, Promise<ArrayBuffer>>();

export function loadGoogleFont(
  family: string,
  weight: number,
  italic = false,
): Promise<ArrayBuffer> {
  const key = `${family}:${weight}:${italic ? "i" : "n"}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const promise = fetchGoogleFont(family, weight, italic);
  cache.set(key, promise);
  return promise;
}

async function fetchGoogleFont(
  family: string,
  weight: number,
  italic: boolean,
): Promise<ArrayBuffer> {
  const spec = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const url = `https://fonts.googleapis.com/css2?family=${family}:${spec}&display=swap`;
  const css = await (await fetch(url)).text();
  const match = css.match(
    /src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/,
  );
  if (!match) throw new Error(`Failed to parse CSS for ${family}`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`Failed to fetch font for ${family}`);
  return res.arrayBuffer();
}

export type OgFont = {
  name: "Display" | "Body" | "Italic";
  data: ArrayBuffer;
  weight: 500 | 700;
  style: "normal" | "italic";
};

export async function getOgFonts(): Promise<OgFont[]> {
  const [display, body, italic] = await Promise.all([
    loadGoogleFont("Bricolage+Grotesque", 700),
    loadGoogleFont("Host+Grotesk", 500),
    loadGoogleFont("Spectral", 500, true),
  ]);
  return [
    { name: "Display", data: display, weight: 700, style: "normal" },
    { name: "Body", data: body, weight: 500, style: "normal" },
    { name: "Italic", data: italic, weight: 500, style: "italic" },
  ];
}

export const OG_PALETTE = {
  paper: "#f4efdf",
  paperDeep: "#ebe4c9",
  ink: "#181812",
  inkSoft: "#4d4b3e",
  inkMuted: "#8a8574",
  rule: "rgba(24,24,18,0.12)",
  ruleSoft: "rgba(24,24,18,0.07)",
  lime: "#caf23d",
  limeDeep: "#344606",
  limeGlow: "rgba(196,245,61,0.32)",
  paperSurface: "rgba(255,255,255,0.55)",
} as const;
