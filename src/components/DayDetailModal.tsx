import { useEffect } from "react";
import { ArrowLeft, Sunrise, Sunset } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";
import { WeatherIcon } from "./WeatherIcon";
import type { OneCallResponse } from "@/lib/owm";
import type { OmHourly } from "@/lib/openmeteo";
import {
  localDayLabel,
  msToKmh,
  moonEmoji,
  moonPhaseName,
  formatTime,
} from "@/lib/weather";
import { buildCtx, pickQuote } from "@/lib/quotes";

function modeIcon(hours: OmHourly[]): string {
  const counts = new Map<string, number>();
  for (const h of hours) {
    const c = h.icon;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = hours[0]?.icon ?? "01d";
  let bestN = 0;
  for (const [k, v] of counts) if (v > bestN) { best = k; bestN = v; }
  return best;
}

function bucketHours(hours: OmHourly[]) {
  // 12 two-hour buckets keyed by start hour 0..22
  const buckets: { start: number; hours: OmHourly[] }[] = [];
  for (let s = 0; s < 24; s += 2) buckets.push({ start: s, hours: [] });
  for (const h of hours) {
    const idx = Math.floor(h.hour / 2);
    if (buckets[idx]) buckets[idx].hours.push(h);
  }
  return buckets;
}

function partRep(hours: OmHourly[]) {
  if (!hours.length) return null;
  const rep = hours.reduce((a, b) => (b.tempC > a.tempC ? b : a));
  const feels = Math.round(hours.reduce((s, h) => s + h.feelsLikeC, 0) / hours.length);
  const pop = Math.round(hours.reduce((s, h) => s + h.popPct, 0) / hours.length);
  const wind = hours.reduce((s, h) => s + h.windKmh, 0) / hours.length;
  return { icon: rep.icon, temp: Math.round(rep.tempC), feels, pop, wind };
}

export function DayDetailModal({
  data,
  omHourly,
  dayIndex,
  onClose,
}: {
  data: OneCallResponse | null;
  omHourly: OmHourly[] | null;
  dayIndex: number | null;
  onClose: () => void;
}) {
  const open = data != null && dayIndex != null;
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const day = data!.daily[dayIndex!];
  const tz = data!.timezone_offset;
  const targetDate = new Date((day.dt + tz) * 1000).toISOString().slice(0, 10);
  const hours: OmHourly[] = (omHourly ?? []).filter((h) => h.date === targetDate);
  const label = localDayLabel(day.dt, tz, dayIndex!);

  const windKmh = msToKmh(day.wind_speed);
  const ctx = buildCtx({
    tempC: day.temp.day,
    feelsLikeC: day.feels_like.day,
    weatherId: day.weather[0].id,
    main: day.weather[0].main,
    windKmh,
    hour: 12,
  });
  const quote = pickQuote(ctx);

  const morning = partRep(hours.filter((h) => h.hour >= 6 && h.hour < 12));
  const afternoon = partRep(hours.filter((h) => h.hour >= 12 && h.hour < 18));
  const evening = partRep(hours.filter((h) => h.hour >= 18));

  const buckets = bucketHours(hours);
  const haveHourly = hours.length > 0;
  const chartData = buckets.map((b) => {
    const hrs = b.hours;
    const lab = `${b.start.toString().padStart(2, "0")}`;
    if (!hrs.length) {
      return { hour: lab, temp: null, rain: 0, pop: 0, wind: 0, icon: "" };
    }
    return {
      hour: lab,
      temp: Math.round(hrs.reduce((s, h) => s + h.tempC, 0) / hrs.length),
      rain: +(hrs.reduce((s, h) => s + h.precipMm, 0)).toFixed(2),
      pop: Math.round(hrs.reduce((s, h) => s + h.popPct, 0) / hrs.length),
      wind: Math.round(hrs.reduce((s, h) => s + h.windKmh, 0) / hrs.length),
      icon: modeIcon(hrs),
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background animate-in fade-in duration-150">
      <div className="mx-auto max-w-[480px] pb-12">
        <header className="sticky top-0 z-10 flex items-center gap-2 bg-background/90 backdrop-blur px-3 pt-4 pb-3 border-b border-border/60">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="ml-auto mr-3 text-right">
            <p className="text-sm font-semibold">{label.short}</p>
            <p className="text-[11px] text-muted-foreground">{label.date}</p>
          </div>
        </header>

        {/* Hero header */}
        <section className="px-5 pt-5">
          <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground capitalize">
                  {day.weather[0].description}
                </p>
                <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                  <span className="text-5xl font-semibold tracking-tight">
                    {Math.round(day.temp.max)}°
                  </span>
                  <span className="text-2xl text-muted-foreground">
                    / {Math.round(day.temp.min)}°
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Feels {Math.round(day.feels_like.day)}° at midday
                </p>
              </div>
              <WeatherIcon code={day.weather[0].icon} size={88} />
            </div>
            <p className="mt-4 text-sm italic text-foreground/70">"{quote}"</p>
          </div>
        </section>

        {/* Sun + Moon mini card */}
        <section className="px-5 mt-4">
          <div className="rounded-3xl bg-card border border-border/60 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Sunrise className="h-4 w-4" />
                {formatTime(day.sunrise, tz)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Sunset className="h-4 w-4" />
                {formatTime(day.sunset, tz)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{moonEmoji(day.moon_phase)}</span>
              <span className="text-xs text-muted-foreground">{moonPhaseName(day.moon_phase)}</span>
            </div>
          </div>
        </section>

        {/* Parts of day */}
        <section className="px-5 mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Across the day
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "Morning", v: morning },
              { key: "Afternoon", v: afternoon },
              { key: "Evening", v: evening },
            ].map((p) => (
              <div key={p.key} className="rounded-2xl border border-border/60 bg-card p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {p.key}
                </p>
                {p.v ? (
                  <>
                    <div className="mt-1 flex items-center justify-between">
                      <WeatherIcon code={p.v.icon} size={36} />
                      <span className="text-xl font-semibold tabular-nums">{p.v.temp}°</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Feels {p.v.feels}°</p>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">—</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Charts */}
        {haveHourly ? (
          <>
            <ChartCard title="Temperature">
              <div className="h-44 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 28, right: 8, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      interval={1}
                    />
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                      formatter={(v: number) => [`${v}°`, "Temp"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="var(--chart-temp)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "var(--background)", stroke: "var(--chart-temp)", strokeWidth: 2 }}
                    >
                      <LabelList
                        dataKey="temp"
                        position="top"
                        offset={8}
                        style={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 500 }}
                        formatter={(v: number | null) => (v == null ? "" : `${v}°`)}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Icons row aligned roughly under columns */}
              <div className="grid grid-cols-12 -mt-1 px-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex justify-center">
                    {d.icon ? <WeatherIcon code={d.icon} size={18} /> : <span className="h-[18px]" />}
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Rain">
              <div className="h-36 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      interval={1}
                    />
                    <YAxis hide domain={[0, "dataMax + 0.5"]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                      formatter={(v: number, _n, p) => [
                        `${v} mm · ${p.payload.pop}%`, "Rain",
                      ]}
                    />
                    <Bar dataKey="rain" radius={[6, 6, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell
                          key={i}
                          fill="var(--chart-rain)"
                          opacity={d.pop >= 25 ? 0.9 : 0.3}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="px-2 pt-1 text-[10px] text-muted-foreground">
                Lighter bars = below 25% chance.
              </p>
            </ChartCard>

            <ChartCard title="Wind (km/h)">
              <div className="h-36 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      interval={1}
                    />
                    <YAxis hide domain={[0, "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                      formatter={(v: number) => [`${v} km/h`, "Wind"]}
                    />
                    <Bar dataKey="wind" fill="var(--muted-foreground)" radius={[6, 6, 0, 0]} opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </>
        ) : (
          <section className="px-5 mt-4">
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
              Hour-by-hour detail isn't available this far ahead.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 mt-4">
      <div className="rounded-3xl bg-card border border-border/60 p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="mt-2">{children}</div>
      </div>
    </section>
  );
}