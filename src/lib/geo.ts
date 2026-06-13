import type { GeoResult } from "./owm";

const KEY = "okayweather.recent";
const MAX = 8;

export interface SavedLocation {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export function getRecent(): SavedLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLocation[]) : [];
  } catch {
    return [];
  }
}

export function saveRecent(loc: SavedLocation) {
  if (typeof window === "undefined") return;
  const list = getRecent().filter(
    (l) => !(l.lat === loc.lat && l.lon === loc.lon),
  );
  list.unshift(loc);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function fromGeo(g: GeoResult): SavedLocation {
  return { name: g.name, country: g.country, state: g.state, lat: g.lat, lon: g.lon };
}

const LAST = "okayweather.last";

export function getLast(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLast(loc: SavedLocation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST, JSON.stringify(loc));
}