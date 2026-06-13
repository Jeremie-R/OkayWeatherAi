import { WeatherIcon } from "./WeatherIcon";
import { WindChip } from "./WindChip";
import type { OneCallResponse, OwmHourly } from "@/lib/owm";
import { localHour, msToKmh } from "@/lib/weather";

function pickRep(hours: OwmHourly[]): OwmHourly {
  if (!hours.length) return null as never;
  // Pick max temp hour as the representative
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

  const cards = (["morning", "afternoon", "evening"] as const).map((k) => {
    const hrs = buckets[k];
    if (!hrs.length) return { key: k, empty: true } as const;
    const rep = pickRep(hrs);
    return {
      key: k,
      empty: false,
      icon: rep.weather[0].icon,
      temp: Math.round(rep.temp),
      feels: Math.round(rep.feels_like),
      pop: Math.round(avg(hrs.map((h) => h.pop)) * 100),
      wind: msToKmh(avg(hrs.map((h) => h.wind_speed))),
    } as const;
  });

  return (
    <section className="px-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="h-4 w-0.5 rounded-full bg-foreground" />
        Tomorrow
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) =>
          c.empty ? (
            <div key={c.key} className="rounded-2xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">
              —
            </div>
          ) : (
            <button
              key={c.key}
              onClick={() => onOpenDetails(1)}
              className="rounded-2xl border border-border/60 bg-card p-3 text-left transition hover:bg-muted/40"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {c.key}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <WeatherIcon code={c.icon} size={40} />
                <span className="text-2xl font-semibold tabular-nums">{c.temp}°</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Feels {c.feels}°</p>
              <p className="text-[11px] text-muted-foreground">Rain {c.pop}%</p>
              <div className="mt-1.5">
                <WindChip kmh={c.wind} />
              </div>
            </button>
          ),
        )}
      </div>
    </section>
  );
}