import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { WeatherIcon } from "@/components/WeatherIcon";
import { useSettings } from "@/hooks/use-settings";
import { getLast } from "@/lib/geo";
import { getWidgetConfig, isNative, setWidgetConfig, type WidgetConfig } from "@/lib/native";
import { MATERIAL_COLOR_PRESETS, WALLPAPER, type IconPack, type Settings } from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OkayWeather" },
      { name: "description", content: "Appearance, icons and units." },
    ],
  }),
  component: SettingsPage,
});

/** One code, shown in every pack — mostly cloudy reads clearly in all three. */
const ICON_SAMPLE = "04d";

const ICON_PACK_LABELS: Record<IconPack, string> = {
  modern: "Modern",
  candy: "Candy",
  classic: "Classic",
};

function SettingsPage() {
  const { settings, set } = useSettings();
  // Resolved in an effect so the server render and the first client render
  // agree — Capacitor only exists in the Android shell.
  const [native, setNative] = useState(false);
  const [widget, setWidget] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    setNative(isNative());
    void getWidgetConfig().then(setWidget);
  }, []);

  async function updateWidget(update: Parameters<typeof setWidgetConfig>[0]) {
    const ok = await setWidgetConfig(update);
    if (ok) setWidget(await getWidgetConfig());
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[480px]">
        <header className="flex items-center gap-2 px-3 pt-6 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-base font-semibold tracking-tight">Settings</h1>
        </header>

        <div className="space-y-4 px-5 pb-10">
          <Section title="Appearance">
            <Row label="Theme">
              <Segmented
                value={settings.theme}
                onChange={(v) => set("theme", v)}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Row>
            <Row label="Style" hint={STYLE_HINTS[settings.style]}>
              <Segmented
                value={settings.style}
                onChange={(v) => set("style", v)}
                options={[
                  { value: "modern", label: "Modern" },
                  { value: "material", label: "Material" },
                  { value: "frosted", label: "Frosted" },
                ]}
              />
            </Row>
            {settings.style === "material" && (
              <Row
                label="Colour"
                hint={
                  settings.materialColor === WALLPAPER
                    ? native
                      ? "Following your wallpaper."
                      : "Wallpaper colours need the Android app; using the app's own palette here."
                    : "A fixed colour, the same everywhere."
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  {MATERIAL_COLOR_PRESETS.map((c) => {
                    const active = settings.materialColor === c.value;
                    const isWallpaper = c.value === WALLPAPER;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => set("materialColor", c.value)}
                        aria-pressed={active}
                        aria-label={c.label}
                        title={c.label}
                        className={`h-9 w-9 rounded-full border transition ${
                          active
                            ? "border-foreground/70 ring-2 ring-foreground/30"
                            : "border-border/60 hover:border-foreground/40"
                        }`}
                        style={
                          isWallpaper
                            ? {
                                backgroundImage:
                                  "conic-gradient(#e57373,#ba68c8,#64b5f6,#4db6ac,#fff176,#e57373)",
                              }
                            : { backgroundColor: c.value }
                        }
                      />
                    );
                  })}
                </div>
              </Row>
            )}
          </Section>

          <Section title="Icons">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ICON_PACK_LABELS) as IconPack[]).map((pack) => {
                const active = settings.iconPack === pack;
                return (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => set("iconPack", pack)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition ${
                      active
                        ? "border-foreground/70 bg-muted/50"
                        : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <WeatherIcon code={ICON_SAMPLE} pack={pack} size={44} />
                    <span className="text-xs font-medium">{ICON_PACK_LABELS[pack]}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Units">
            <Row label="Temperature">
              <Segmented
                value={settings.temp}
                onChange={(v) => set("temp", v)}
                options={[
                  { value: "c", label: "°C" },
                  { value: "f", label: "°F" },
                ]}
              />
            </Row>
            <Row label="Wind speed">
              <Segmented
                value={settings.wind}
                onChange={(v) => set("wind", v)}
                options={[
                  { value: "kmh", label: "km/h" },
                  { value: "ms", label: "m/s" },
                  { value: "mph", label: "mph" },
                ]}
              />
            </Row>
            <Row label="Clock">
              <Segmented
                value={settings.clock}
                onChange={(v) => set("clock", v)}
                options={[
                  { value: "24h", label: "24h" },
                  { value: "12h", label: "12h" },
                ]}
              />
            </Row>
          </Section>

          {native && widget && (
            <Section title="Home-screen widget">
              <Row
                label="Refresh"
                hint="How often the widget fetches new weather. Shorter is fresher but uses a little more battery."
              >
                <Segmented
                  value={String(widget.refreshIntervalMinutes)}
                  onChange={(v) => void updateWidget({ refreshIntervalMinutes: Number(v) })}
                  options={[
                    { value: "15", label: "15 min" },
                    { value: "30", label: "30 min" },
                    { value: "60", label: "1 h" },
                    { value: "180", label: "3 h" },
                  ]}
                />
              </Row>
              <Row
                label="Location"
                hint={
                  widget.useDeviceLocation
                    ? "Following this device's location."
                    : `Pinned to ${widget.placeName ?? "a saved place"}.`
                }
              >
                <Segmented
                  value={widget.useDeviceLocation ? "device" : "pinned"}
                  onChange={(v) => {
                    if (v === "device") {
                      void updateWidget({ useDeviceLocation: true });
                      return;
                    }
                    const last = getLast();
                    if (last) {
                      void updateWidget({
                        useDeviceLocation: false,
                        lat: last.lat,
                        lon: last.lon,
                        placeName: last.name,
                      });
                    }
                  }}
                  options={[
                    { value: "device", label: "This device" },
                    { value: "pinned", label: "App's city" },
                  ]}
                />
              </Row>
              {!widget.hasWidget && (
                <p className="text-[11px] text-muted-foreground">
                  No widget placed yet — long-press your home screen, choose Widgets, then Okay
                  Weather.
                </p>
              )}
            </Section>
          )}

          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
            Forecast by OpenWeatherMap and Open-Meteo · Radar from RainViewer · Base map ©
            OpenStreetMap contributors, © CARTO
          </p>
        </div>
      </div>
    </div>
  );
}

const STYLE_HINTS: Record<Settings["style"], string> = {
  modern: "Bordered cards on a plain background.",
  material: "Sections set apart by colour instead of borders.",
  frosted: "Translucent cards over a colour gradient.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * A row of mutually exclusive options. Generic over the value so each call
 * site keeps its own union type — passing a bad option is a type error.
 */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="group" className="flex w-full items-stretch gap-1 rounded-full bg-muted/60 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Keeps the Settings union types honest if a new key is added later.
export type { Settings };
