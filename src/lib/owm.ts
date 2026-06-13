const API_KEY = "1b749d41f9cb4c407684cc74a9c35dcc";
// NOTE: This key is shipped publicly in the bundle. Rotate it on
// openweathermap.org if quota gets abused.

const BASE = "https://api.openweathermap.org";

export interface OwmCurrent {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weather: { id: number; main: string; description: string; icon: string }[];
}

export interface OwmHourly {
  dt: number;
  temp: number;
  feels_like: number;
  pop: number;
  wind_speed: number;
  weather: { id: number; main: string; description: string; icon: string }[];
}

export interface OwmDaily {
  dt: number;
  sunrise: number;
  sunset: number;
  moon_phase: number;
  temp: { min: number; max: number; morn: number; day: number; eve: number; night: number };
  feels_like: { morn: number; day: number; eve: number; night: number };
  pop: number;
  wind_speed: number;
  weather: { id: number; main: string; description: string; icon: string }[];
}

export interface OneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: OwmCurrent;
  hourly: OwmHourly[];
  daily: OwmDaily[];
}

export async function fetchOneCall(lat: number, lon: number): Promise<OneCallResponse> {
  const url = `${BASE}/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Weather API error: ${r.status}`);
  return r.json();
}

export interface GeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export async function geocode(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = `${BASE}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  return r.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult | null> {
  const url = `${BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const data = await r.json();
  return data[0] ?? null;
}