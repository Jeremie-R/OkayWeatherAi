/**
 * User preferences: appearance and units.
 *
 * Stored in localStorage under a single key so one read/write keeps
 * everything consistent. Pure helpers only — the React side lives in
 * hooks/use-settings.tsx.
 */

export type ThemeMode = "system" | "light" | "dark";
export type SurfaceStyle = "solid" | "frosted";
export type AccentSource = "default" | "materialYou";
export type IconPack = "candy" | "classic";
export type TempUnit = "c" | "f";
export type WindUnit = "kmh" | "ms" | "mph";
export type ClockFormat = "24h" | "12h";

export interface Settings {
  theme: ThemeMode;
  surface: SurfaceStyle;
  accent: AccentSource;
  iconPack: IconPack;
  temp: TempUnit;
  wind: WindUnit;
  clock: ClockFormat;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  surface: "solid",
  accent: "default",
  iconPack: "candy",
  temp: "c",
  wind: "kmh",
  clock: "24h",
};

export const SETTINGS_KEY = "okayweather.settings";

const THEMES: ThemeMode[] = ["system", "light", "dark"];
const SURFACES: SurfaceStyle[] = ["solid", "frosted"];
const ACCENTS: AccentSource[] = ["default", "materialYou"];
const ICON_PACKS: IconPack[] = ["candy", "classic"];
const TEMPS: TempUnit[] = ["c", "f"];
const WINDS: WindUnit[] = ["kmh", "ms", "mph"];
const CLOCKS: ClockFormat[] = ["24h", "12h"];

/** Never trust what's in storage — an old build may have written other values. */
export function normalizeSettings(raw: unknown): Settings {
  const o = (raw ?? {}) as Partial<Settings>;
  const pick = <T>(value: unknown, allowed: T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  return {
    theme: pick(o.theme, THEMES, DEFAULT_SETTINGS.theme),
    surface: pick(o.surface, SURFACES, DEFAULT_SETTINGS.surface),
    accent: pick(o.accent, ACCENTS, DEFAULT_SETTINGS.accent),
    iconPack: pick(o.iconPack, ICON_PACKS, DEFAULT_SETTINGS.iconPack),
    temp: pick(o.temp, TEMPS, DEFAULT_SETTINGS.temp),
    wind: pick(o.wind, WINDS, DEFAULT_SETTINGS.wind),
    clock: pick(o.clock, CLOCKS, DEFAULT_SETTINGS.clock),
  };
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Private mode / quota — the session still works, it just won't persist.
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

/** Status-bar / PWA theme colour per resolved theme. */
const THEME_COLOR = { light: "#ffffff", dark: "#1a1c23" } as const;

/**
 * Push the settings that are expressed in CSS onto <html>. Tailwind's dark
 * variant keys off the `dark` class (see styles.css), the surface and accent
 * styles off data attributes.
 */
export function applySettings(settings: Settings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveTheme(settings.theme);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.surface = settings.surface;
  root.dataset.accent = settings.accent;
  // Tells the browser to render native widgets (scrollbars, form controls)
  // in the matching scheme.
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[resolved]);
}

/**
 * Runs in <head> before first paint so a dark-mode user never sees a white
 * flash. Deliberately tiny and dependency-free; it mirrors applySettings for
 * the two attributes that affect painting.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement,s={};
try{s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}")}catch(e){}
var m=s.theme||"system";
var dark=m==="dark"||(m==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.classList.toggle("dark",dark);
d.dataset.surface=s.surface||"solid";
d.dataset.accent=s.accent||"default";
d.style.colorScheme=dark?"dark":"light";
}catch(e){}})();`;
