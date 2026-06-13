import { Droplets } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import type { OneCallResponse } from "@/lib/owm";
import { localDayLabel } from "@/lib/weather";

export function TenDaySection({
  data,
  onOpenDay,
}: {
  data: OneCallResponse;
  onOpenDay: (dayIndex: number) => void;
}) {
  const days = data.daily
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i !== 1); // show today, skip tomorrow (has its own section)
  const allDays = data.daily;
  const periodMin = Math.min(...allDays.map((d) => d.temp.min));
  const periodMax = Math.max(...allDays.map((d) => d.temp.max));
  const range = Math.max(1, periodMax - periodMin);
  return (
    <section className="px-5 pb-12">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="h-4 w-0.5 rounded-full bg-foreground" />
        Next days
      </h2>
      <div className="rounded-3xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
        {days.map(({ d, i: idx }) => {
          const { short, date } = localDayLabel(d.dt, data.timezone_offset, idx);
          const pop = Math.round(d.pop * 100);
          const rainMm = d.rain ?? 0;
          const leftPct = ((d.temp.min - periodMin) / range) * 100;
          const widthPct = Math.max(6, ((d.temp.max - d.temp.min) / range) * 100);
          return (
            <button
              key={d.dt}
              onClick={() => onOpenDay(idx)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
            >
              <div className="w-16 shrink-0">
                <p className="text-sm font-medium">{short}</p>
                <p className="text-[11px] text-muted-foreground">{date}</p>
              </div>
              <div className="w-10 shrink-0 flex flex-col items-center">
                <WeatherIcon code={d.weather[0].icon} size={32} />
                {pop >= 25 && rainMm > 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-[var(--chart-rain)]">
                    <Droplets className="h-2.5 w-2.5" />
                    {rainMm.toFixed(1)}
                  </span>
                )}
              </div>
              <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">
                {Math.round(d.temp.min)}°
              </span>
              <div className="relative h-1.5 flex-1 rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm font-semibold tabular-nums">
                {Math.round(d.temp.max)}°
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}