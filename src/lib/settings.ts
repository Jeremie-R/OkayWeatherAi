/**
 * User preferences: appearance and units.
 *
 * Stored in localStorage under a single key so one read/write keeps
 * everything consistent. Pure helpers only — the React side lives in
 * hooks/use-settings.tsx.
 */

export type ThemeMode = "system" | "light" | "dark";

/**
 * One axis, three mutually exclusive looks:
 *   modern   - bordered cards on a plain background (the original look)
 *   material - Material You: sections separated by tonal fills, no borders,
 *              palette from the wallpaper or a chosen colour
 *   frosted  - translucent cards over a colour gradient
 */
export type AppStyle = "modern" | "material" | "frosted";

export type IconPack = "modern" | "candy" | "classic";
export type TempUnit = "c" | "f";
export type WindUnit = "kmh" | "ms" | "mph";
export type ClockFormat = "24h" | "12h";

/** "wallpaper" follows Android's own palette; anything else is a #rrggbb seed. */
export const WALLPAPER = "wallpaper";

export interface Settings {
  theme: ThemeMode;
  style: AppStyle;
  /** Only meaningful when style is "material". */
  materialColor: string;
  iconPack: IconPack;
  temp: TempUnit;
  wind: WindUnit;
  clock: ClockFormat;
}

export const ICON_PACKS: IconPack[] = ["modern", "candy", "classic"];
export const APP_STYLES: AppStyle[] = ["modern", "material", "frosted"];

/** Seed colours offered alongside the wallpaper option. */
export const MATERIAL_COLOR_PRESETS: { value: string; label: string }[] = [
  { value: WALLPAPER, label: "Wallpaper" },
  { value: "#9e93c7", label: "Lilac" },
  { value: "#4b7fd6", label: "Blue" },
  { value: "#2f9e7e", label: "Green" },
  { value: "#d08a3e", label: "Amber" },
  { value: "#c2548c", label: "Rose" },
];

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  style: "modern",
  materialColor: WALLPAPER,
  iconPack: "modern",
  temp: "c",
  wind: "kmh",
  clock: "24h",
};

export const SETTINGS_KEY = "okayweather.settings";

const THEMES: ThemeMode[] = ["system", "light", "dark"];
const TEMPS: TempUnit[] = ["c", "f"];
const WINDS: WindUnit[] = ["kmh", "ms", "mph"];
const CLOCKS: ClockFormat[] = ["24h", "12h"];

const HEX = /^#[0-9a-f]{6}$/i;

/** Never trust what's in storage — an old build may have written other values. */
export function normalizeSettings(raw: unknown): Settings {
  const o = (raw ?? {}) as Partial<Settings>;
  const pick = <T>(value: unknown, allowed: T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const color =
    typeof o.materialColor === "string" &&
    (o.materialColor === WALLPAPER || HEX.test(o.materialColor))
      ? o.materialColor
      : DEFAULT_SETTINGS.materialColor;
  return {
    theme: pick(o.theme, THEMES, DEFAULT_SETTINGS.theme),
    style: pick(o.style, APP_STYLES, DEFAULT_SETTINGS.style),
    materialColor: color,
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
 * variant keys off the `dark` class (see styles.css), the look off
 * data-style.
 */
export function applySettings(settings: Settings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveTheme(settings.theme);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.style = settings.style;
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
d.dataset.style=s.style||"modern";
d.style.colorScheme=dark?"dark":"light";
}catch(e){}})();`;
