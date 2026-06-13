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
  const days = data.daily.slice(1); // skip today
  return (
    <section className="px-5 pb-12">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="h-4 w-0.5 rounded-full bg-foreground" />
        Next days
      </h2>
      <div className="rounded-3xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
        {days.map((d, i) => {
          const idx = i + 1;
          const { short, date } = localDayLabel(d.dt, data.timezone_offset, idx);
          const pop = Math.round(d.pop * 100);
          return (
            <button
              key={d.dt}
              onClick={() => onOpenDay(idx)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
            >
              <div className="w-20">
                <p className="text-sm font-medium">{short}</p>
                <p className="text-[11px] text-muted-foreground">{date}</p>
              </div>
              <WeatherIcon code={d.weather[0].icon} size={36} />
              <div className="flex-1" />
              {pop >= 10 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chart-rain)]/15 px-2 py-0.5 text-xs font-medium text-[var(--chart-rain)]">
                  <Droplets className="h-3 w-3" />
                  {pop}%
                </span>
              )}
              <div className="w-20 text-right tabular-nums">
                <span className="text-muted-foreground">{Math.round(d.temp.min)}°</span>
                <span className="mx-1.5 text-muted-foreground/40">/</span>
                <span className="font-semibold">{Math.round(d.temp.max)}°</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}