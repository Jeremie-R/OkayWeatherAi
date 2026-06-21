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
  return { host: j.host, frames, nowIndex: past.length };
}

/** Build the radar tile URL template for Leaflet. */
export function tileUrl(host: string, path: string): string {
  // color 2 = universal blue, options: smooth=1, snow=1
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}