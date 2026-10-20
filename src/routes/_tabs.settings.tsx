import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { WeatherIcon } from "@/components/WeatherIcon";
import { useSettings } from "@/hooks/use-settings";
import type { IconPack, Settings } from "@/lib/settings";

export const Route = createFileRoute("/_tabs/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OkayWeather" },
      { name: "description", content: "Appearance, icons and units." },
    ],
  }),
  component: SettingsPage,
});

/** A few codes that look clearly different between the two packs. */
const ICON_SAMPLE = ["01d", "10d", "11d", "13d"];

const ICON_PACK_LABELS: Record<IconPack, string> = {
  candy: "Candy",
  classic: "Classic",
};

function SettingsPage() {
  const { settings, set } = useSettings();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[480px]">
        <header className="px-5 pt-8 pb-4">
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
            <Row label="Surface" hint="Frosted blurs the background behind cards.">
              <Segmented
                value={settings.surface}
                onChange={(v) => set("surface", v)}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "frosted", label: "Frosted" },
                ]}
              />
            </Row>
          </Section>

          <Section title="Icons">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(ICON_PACK_LABELS) as IconPack[]).map((pack) => {
                const active = settings.iconPack === pack;
                return (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => set("iconPack", pack)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-foreground/70 bg-muted/50"
                        : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      {ICON_SAMPLE.map((code) => (
                        <WeatherIcon key={code} code={code} pack={pack} size={34} />
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-medium">{ICON_PACK_LABELS[pack]}</p>
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

          <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
            Forecast by OpenWeatherMap and Open-Meteo · Radar from RainViewer · Base map ©
            OpenStreetMap contributors, © CARTO
          </p>
        </div>
      </div>
    </div>
  );
}

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
