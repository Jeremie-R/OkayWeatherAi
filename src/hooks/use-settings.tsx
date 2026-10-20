import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { applyMaterialYou, clearMaterialYou } from "@/lib/materialyou";
import { getMaterialYouPalette } from "@/lib/native";

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

  // Material You: ask the shell for the wallpaper palette and paint it onto
  // the CSS variables. Re-runs on theme changes because light and dark map to
  // different shades of the same palette.
  useEffect(() => {
    if (!hydrated) return;
    if (settings.accent !== "materialYou") {
      clearMaterialYou();
      return;
    }
    let cancelled = false;
    void getMaterialYouPalette().then((palette) => {
      if (cancelled) return;
      if (palette.available && palette.colors) {
        applyMaterialYou(palette.colors, resolveTheme(settings.theme), settings.surface);
      } else {
        // Web build, or Android below 12 — stay on the stock palette.
        clearMaterialYou();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [settings.accent, settings.theme, settings.surface, hydrated]);

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
