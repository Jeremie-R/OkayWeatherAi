// Open-Meteo Air Quality API — free, no key required.
// https://open-meteo.com/en/docs/air-quality-api

export interface AirQuality {
  /** European AQI (0..100+). */
  aqi: number;
}

export type AqiTier = "good" | "fair" | "passable" | "poor" | "hazardous";

export function aqiTier(aqi: number): AqiTier {
  if (aqi < 20) return "good";
  if (aqi < 40) return "fair";
  if (aqi < 60) return "passable";
  if (aqi < 80) return "poor";
  return "hazardous";
}

export const AQI_TIER_LABEL: Record<AqiTier, string> = {
  good: "Good",
  fair: "Fair",
  passable: "Passable",
  poor: "Poor",
  hazardous: "Hazardous",
};

export const AQI_TIER_COLOR: Record<AqiTier, string> = {
  good: "var(--aqi-good)",
  fair: "var(--aqi-fair)",
  passable: "var(--aqi-passable)",
  poor: "var(--aqi-poor)",
  hazardous: "var(--aqi-hazardous)",
};

export async function fetchAirQuality(
  lat: number,
  lon: number,
): Promise<AirQuality | null> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as { current?: { european_aqi?: number } };
  const aqi = j.current?.european_aqi;
  if (aqi == null) return null;
  return { aqi };
}

export type UvTier = "low" | "moderate" | "high" | "very-high" | "extreme";

export function uvTier(uvi: number): UvTier {
  if (uvi < 3) return "low";
  if (uvi < 6) return "moderate";
  if (uvi < 8) return "high";
  if (uvi < 11) return "very-high";
  return "extreme";
}

export const UV_TIER_LABEL: Record<UvTier, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "very-high": "Very high",
  extreme: "Extreme",
};

export const UV_TIER_COLOR: Record<UvTier, string> = {
  low: "var(--uv-low)",
  moderate: "var(--uv-moderate)",
  high: "var(--uv-high)",
  "very-high": "var(--uv-very-high)",
  extreme: "var(--uv-extreme)",
};