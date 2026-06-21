import type { MinutelyPrecip } from "./owm";

export interface UpcomingRainPoint {
  /** Minutes from now, 0..60 */
  minute: number;
  /** mm/h */
  mm: number;
  label: string;
}

export interface UpcomingRain {
  hasRain: boolean;
  points: UpcomingRainPoint[];
  summary: string;
  peakMm: number;
}

/** Anything at/above this is "real" rain (mm/h). Below = sensor noise. */
const RAIN_FLOOR = 0.05;

export function buildUpcomingRain(
  minutely: MinutelyPrecip[] | undefined,
  nowDt: number,
): UpcomingRain {
  const empty: UpcomingRain = { hasRain: false, points: [], summary: "", peakMm: 0 };
  if (!minutely || minutely.length === 0) return empty;

  // Map to 0..60 minute offsets from `nowDt`. Clamp negatives, drop > 60.
  const points: UpcomingRainPoint[] = [];
  for (const m of minutely) {
    const offset = Math.round((m.dt - nowDt) / 60);
    if (offset < 0 || offset > 60) continue;
    points.push({
      minute: offset,
      mm: Math.max(0, m.precipitation ?? 0),
      label: offset === 0 ? "now" : `+${offset}`,
    });
  }
  if (points.length === 0) return empty;
  points.sort((a, b) => a.minute - b.minute);

  const peakMm = points.reduce((p, x) => (x.mm > p ? x.mm : p), 0);
  if (peakMm < RAIN_FLOOR) return empty;

  // Find first minute where rain starts and where it ends within the window.
  const startIdx = points.findIndex((p) => p.mm >= RAIN_FLOOR);
  let endIdx = points.length - 1;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].mm >= RAIN_FLOOR) { endIdx = i; break; }
  }
  const startMin = points[startIdx].minute;
  const endMin = points[endIdx].minute;
  const rainingNow = points[0].mm >= RAIN_FLOOR;

  const intensity = peakMm < 0.5 ? "Light" : peakMm < 2.5 ? "Moderate" : "Heavy";

  let summary: string;
  if (!rainingNow) {
    summary = `Starts in ~${startMin} min`;
    if (endMin < 60) summary += `, eases by +${endMin}`;
  } else if (endMin >= 60) {
    summary = `${intensity} rain for the next hour`;
  } else if (endMin <= 5) {
    summary = `Easing off now`;
  } else {
    summary = `${intensity} rain, eases in ~${endMin} min`;
  }

  return { hasRain: true, points, summary, peakMm };
}