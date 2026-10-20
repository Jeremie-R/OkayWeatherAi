import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applySettings,
  DEFAULT_SETTINGS,
  loadSettings,
  resolveTheme,
  saveSettings,
  type Settings,
} from "@/lib/settings";
import { applyMaterialPalette, clearMaterialPalette } from "@/lib/materialyou";
import { getMaterialYouPalette, setWidgetConfig } from "@/lib/native";
import { paletteFromSeed } from "@/lib/palette";
import { WALLPAPER } from "@/lib/settings";

interface SettingsContextValue {
  settings: Settings;
  /** Update one key; everything else is kept. */
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Start from the defaults so the server render and the first client render
  // agree; the real values land in the effect below. The inline script in
  // __root.tsx has already painted the right theme by then.
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    applySettings(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applySettings(settings);
    saveSettings(settings);
  }, [settings, hydrated]);

  // Material style: either Android's wallpaper ramps or ramps generated from
  // the chosen colour. Re-runs on theme changes because light and dark map to
  // different shades of the same palette.
  useEffect(() => {
    if (!hydrated) return;
    if (settings.style !== "material") {
      clearMaterialPalette();
      return;
    }
    const resolved = resolveTheme(settings.theme);

    if (settings.materialColor !== WALLPAPER) {
      applyMaterialPalette(paletteFromSeed(settings.materialColor), resolved);
      return;
    }

    let cancelled = false;
    void getMaterialYouPalette().then((palette) => {
      if (cancelled) return;
      if (palette.available && palette.colors) {
        applyMaterialPalette(palette.colors, resolved);
      } else {
        // Web build, or Android below 12 — fall back to the brand colour so
        // the style still looks like itself rather than doing nothing.
        applyMaterialPalette(paletteFromSeed("#9e93c7"), resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [settings.style, settings.materialColor, settings.theme, hydrated]);

  // The home-screen widget draws the same icons as the app, so push the pack
  // across whenever it changes. Skipped on the first render after hydration —
  // the native side already has the stored value, and writing it would kick
  // off a redundant refresh every time the app opens.
  const lastPushedPack = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (lastPushedPack.current === null) {
      lastPushedPack.current = settings.iconPack;
      return;
    }
    if (lastPushedPack.current === settings.iconPack) return;
    lastPushedPack.current = settings.iconPack;
    void setWidgetConfig({ iconPack: settings.iconPack });
  }, [settings.iconPack, hydrated]);

  // Follow the OS while the theme is set to "system".
  useEffect(() => {
    if (settings.theme !== "system" || typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applySettings(settings);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [settings]);

  const set = useCallback<SettingsContextValue["set"]>((key, value) => {
    setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, set, reset }), [settings, set, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * Reading settings outside the provider is a programming error everywhere in
 * this app, but returning the defaults keeps a stray component rendering
 * rather than crashing the whole tree.
 */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (ctx) return ctx;
  return { settings: DEFAULT_SETTINGS, set: () => {}, reset: () => {} };
}
