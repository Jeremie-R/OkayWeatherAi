/**
 * Bridge to the Android shell (android/.../plugin/OkayWeatherPlugin.kt).
 *
 * Every call degrades to "not available" on the web build, so callers never
 * need to branch on the platform themselves.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";

export interface MaterialYouPalette {
  available: boolean;
  /** e.g. { accent1_600: "#6750a4", neutral1_10: "#f7f2fa", ... } */
  colors?: Record<string, string>;
}

export interface WidgetConfig {
  refreshIntervalMinutes: number;
  useDeviceLocation: boolean;
  placeName: string | null;
  /** False when no widget is on a home screen yet. */
  hasWidget: boolean;
}

export interface WidgetConfigUpdate {
  refreshIntervalMinutes?: number;
  useDeviceLocation?: boolean;
  lat?: number;
  lon?: number;
  placeName?: string;
}

interface OkayWeatherNativePlugin {
  getMaterialYouPalette(): Promise<MaterialYouPalette>;
  getWidgetConfig(): Promise<WidgetConfig>;
  setWidgetConfig(options: WidgetConfigUpdate): Promise<{ ok: boolean }>;
}

const plugin = registerPlugin<OkayWeatherNativePlugin>("OkayWeatherNative");

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function getMaterialYouPalette(): Promise<MaterialYouPalette> {
  if (!isNative()) return { available: false };
  try {
    return await plugin.getMaterialYouPalette();
  } catch {
    return { available: false };
  }
}

export async function getWidgetConfig(): Promise<WidgetConfig | null> {
  if (!isNative()) return null;
  try {
    return await plugin.getWidgetConfig();
  } catch {
    return null;
  }
}

export async function setWidgetConfig(update: WidgetConfigUpdate): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await plugin.setWidgetConfig(update);
    return true;
  } catch {
    return false;
  }
}
