// NOTE: RainViewer's free feed is past radar only since 1 Jan 2026 (nowcast
// discontinued) and caps tiles at zoom 7. Minute-level rain *prediction* still
// comes free from OpenWeatherMap's `minutely` block — see lib/upcomingRain.ts.
export interface RainViewerFrame {
  time: number; // unix seconds
  path: string; // e.g. /v2/radar/1700000000
  kind: "past" | "nowcast";
}

export interface RainViewerData {
  host: string;
  frames: RainViewerFrame[];
  nowIndex: number; // index of the first nowcast frame (or last past+1)
}

interface ApiFrame {
  time: number;
  path: string;
}

interface ApiResponse {
  host: string;
  radar: { past: ApiFrame[]; nowcast: ApiFrame[] };
}

export async function fetchRainViewerFrames(): Promise<RainViewerData> {
  const r = await fetch("https://api.rainviewer.com/public/weather-maps.json");
  if (!r.ok) throw new Error(`RainViewer API error: ${r.status}`);
  const j: ApiResponse = await r.json();
  const past: RainViewerFrame[] = j.radar.past.map((f) => ({ ...f, kind: "past" }));
  const nowcast: RainViewerFrame[] = j.radar.nowcast.map((f) => ({ ...f, kind: "nowcast" }));
  const frames = [...past, ...nowcast];
  // With nowcast present this is the first future frame. RainViewer dropped
  // nowcast from the free feed in Jan 2026, so clamp it to the last past
  // frame — otherwise the "now" marker sits past the end of the slider.
  const nowIndex = Math.min(past.length, Math.max(0, frames.length - 1));
  return { host: j.host, frames, nowIndex };
}

/** Build the radar tile URL template for Leaflet. */
export function tileUrl(host: string, path: string): string {
  // color 2 = universal blue, options: smooth=1, snow=1
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}
