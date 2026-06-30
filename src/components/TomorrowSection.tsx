import { CloudRain } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { WindChip } from "./WindChip";
import type { OneCallResponse, OwmHourly } from "@/lib/owm";
import { localHour, msToKmh } from "@/lib/weather";

function pickRep(hours: OwmHourly[]): OwmHourly | null {
  if (!hours.length) return null;
  return hours.reduce((a, b) => (b.temp > a.temp ? b : a));
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function TomorrowSection({
  data,
  onOpenDetails,
}: {
  data: OneCallResponse;
  onOpenDetails: (dayIndex: number) => void;
}) {
  const { hourly, timezone_offset, current } = data;
  const todayDate = new Date((current.dt + timezone_offset) * 1000).getUTCDate();

  const tomorrowHours = hourly.filter((h) => {
    const d = new Date((h.dt + timezone_offset) * 1000);
    return d.getUTCDate() !== todayDate;
  });

  const buckets = {
    morning: tomorrowHours.filter((h) => {
      const hr = localHour(h.dt, timezone_offset);
      return hr >= 6 && hr < 12;
    }),
    afternoon: tomorrowHours.filter((h) => {
      const hr = localHour(h.dt, timezone_offset);
      return hr >= 12 && hr < 18;
    }),
    evening: tomorrowHours.filter((h) => {
      const hr = localHour(h.dt, timezone_offset);
      return hr >= 18;
    }),
  };

  const parts = (["morning", "afternoon", "evening"] as const).map((k) => {
    const hrs = buckets[k];
    const rep = pickRep(hrs);
    return {
      key: k,
      icon: rep?.weather[0].icon,
      temp: rep ? Math.round(rep.temp) : null,
    };
  });

  const dayPop = tomorrowHours.length
    ? Math.round(avg(tomorrowHours.map((h) => h.pop)) * 100)
    : 0;
  const dayWind = tomorrowHours.length
    ? msToKmh(avg(tomorrowHours.map((h) => h.wind_speed)))
    : 0;

  return (
    <section className="px-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="h-4 w-0.5 rounded-full bg-foreground" />
        Tomorrow
      </h2>
      <button
        onClick={() => onOpenDetails(1)}
        className="w-full rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:bg-muted/40"
      >
        <div className="grid grid-cols-3 gap-2">
          {parts.map((p) => (
            <div key={p.key} className="flex flex-col items-center gap-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {p.key}
              </p>
              {p.icon ? (
                <WeatherIcon code={p.icon} size={44} />
              ) : (
                <div className="h-[44px] w-[44px]" />
              )}
              <span className="text-xl font-semibold tabular-nums">
                {p.temp != null ? `${p.temp}°` : "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-border/60" />
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CloudRain className="h-3.5 w-3.5" />
            Rain {dayPop}%
          </span>
          <WindChip kmh={dayWind} showSpeed />
        </div>
      </button>
    </section>
  );
}