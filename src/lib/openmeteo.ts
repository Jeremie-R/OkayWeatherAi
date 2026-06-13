// Open-Meteo: free hourly forecast up to 16 days, no API key required.
// Docs: https://open-meteo.com/en/docs

export interface OmHourly {
  /** Local ISO string from Open-Meteo (timezone=auto), e.g. "2026-06-13T14:00" */
  time: string;
  /** Local date portion "YYYY-MM-DD" — precomputed for fast day filtering */
  date: string;
  /** Local hour 0..23 — precomputed */
  hour: number;
  tempC: number;
  feelsLikeC: number;
  /** mm in the hour */
  precipMm: number;
  /** 0..100 */
  popPct: number;
  /** OWM-style icon code, e.g. "10d" */
  icon: string;
  /** km/h */
  windKmh: number;
  /** km/h */
  gustKmh: number;
  /** degrees, meteorological */
  windDeg: number;
  isDay: boolean;
}

export interface OpenMeteoResponse {
  utcOffsetSeconds: number;
  timezone: string;
  hourly: OmHourly[];
}

/** Map WMO weather code + day/night to an OWM icon code we already have assets for. */
export function wmoToOwmIcon(code: number, isDay: boolean): string {
  const dn = isDay ? "d" : "n";
  if (code === 0) return `01${dn}`;
  if (code === 1) return `02${dn}`;
  if (code === 2) return `03${dn}`;
  if (code === 3) return `04${dn}`;
  if (code === 45 || code === 48) return `50${dn}`;
  if ([51, 53, 55, 56, 57].includes(code)) return `09${dn}`;
  if ([61, 63, 65, 66, 67].includes(code)) return `10${dn}`;
  if ([80, 81, 82].includes(code)) return `09${dn}`;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return `13${dn}`;
  if ([95, 96, 99].includes(code)) return `11${dn}`;
  return `04${dn}`;
}

export async function fetchOpenMeteoHourly(
  lat: number,
  lon: number,
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "weathercode",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "is_day",
    ].join(","),
    forecast_days: "10",
    timezone: "auto",
    wind_speed_unit: "kmh",
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo error: ${r.status}`);
  const j = (await r.json()) as {
    utc_offset_seconds: number;
    timezone: string;
    hourly: {
      time: string[];
      temperature_2m: number[];
      apparent_temperature: number[];
      precipitation: number[];
      precipitation_probability: (number | null)[];
      weathercode: number[];
      wind_speed_10m: number[];
      wind_gusts_10m: number[];
      wind_direction_10m: number[];
      is_day: number[];
    };
  };

  const h = j.hourly;
  const hourly: OmHourly[] = h.time.map((t, i) => {
    const isDay = h.is_day[i] === 1;
    return {
      time: t,
      date: t.slice(0, 10),
      hour: parseInt(t.slice(11, 13), 10),
      tempC: h.temperature_2m[i],
      feelsLikeC: h.apparent_temperature[i],
      precipMm: h.precipitation[i] ?? 0,
      popPct: h.precipitation_probability[i] ?? 0,
      icon: wmoToOwmIcon(h.weathercode[i], isDay),
      windKmh: h.wind_speed_10m[i],
      gustKmh: h.wind_gusts_10m[i],
      windDeg: h.wind_direction_10m[i],
      isDay,
    };
  });

  return {
    utcOffsetSeconds: j.utc_offset_seconds,
    timezone: j.timezone,
    hourly,
  };
}