/**
 * Unit conversion and formatting.
 *
 * Everything upstream (OpenWeatherMap with units=metric, Open-Meteo) is in
 * °C and km/h, so those stay the internal representation — thresholds like
 * windTier() in lib/weather.ts keep working — and only display converts.
 */
import type { ClockFormat, TempUnit, WindUnit } from "./settings";

export function toDisplayTemp(celsius: number, unit: TempUnit): number {
  return unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

/** Rounded temperature with the degree sign, e.g. "18°". */
export function formatTemp(celsius: number, unit: TempUnit): string {
  return `${Math.round(toDisplayTemp(celsius, unit))}°`;
}

/** Rounded temperature with the unit spelled out, e.g. "18 °C". */
export function formatTempWithUnit(celsius: number, unit: TempUnit): string {
  return `${Math.round(toDisplayTemp(celsius, unit))} ${unit === "f" ? "°F" : "°C"}`;
}

export function toDisplayWind(kmh: number, unit: WindUnit): number {
  if (unit === "ms") return kmh / 3.6;
  if (unit === "mph") return kmh / 1.609344;
  return kmh;
}

export const WIND_UNIT_LABEL: Record<WindUnit, string> = {
  kmh: "km/h",
  ms: "m/s",
  mph: "mph",
};

/** e.g. "32 km/h" — m/s keeps one decimal because its numbers are small. */
export function formatWind(kmh: number, unit: WindUnit): string {
  const v = toDisplayWind(kmh, unit);
  const n = unit === "ms" ? v.toFixed(1) : Math.round(v).toString();
  return `${n} ${WIND_UNIT_LABEL[unit]}`;
}

/**
 * Hour label for chart axes, e.g. "17h" or "5pm". `hour` is a local
 * hour-of-day in 0..23.
 */
export function formatHour(hour: number, clock: ClockFormat): string {
  const h = ((hour % 24) + 24) % 24;
  if (clock === "12h") {
    const suffix = h < 12 ? "am" : "pm";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${suffix}`;
  }
  return `${h.toString().padStart(2, "0")}h`;
}

/**
 * Wall-clock time for a unix timestamp shifted into a target zone, e.g.
 * "18:54" or "6:54 pm".
 */
export function formatClock(unix: number, tzOffsetSec: number, clock: ClockFormat): string {
  const d = new Date((unix + tzOffsetSec) * 1000);
  const h = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  if (clock === "12h") {
    const suffix = h < 12 ? "am" : "pm";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mm} ${suffix}`;
  }
  return `${String(h).padStart(2, "0")}:${mm}`;
}
