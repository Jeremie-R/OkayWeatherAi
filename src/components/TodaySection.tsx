import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { WeatherIcon } from "./WeatherIcon";
import { WindChip } from "./WindChip";
import type { OneCallResponse } from "@/lib/owm";
import { buildCtx, pickQuote } from "@/lib/quotes";
import { localHour, msToKmh } from "@/lib/weather";

export function TodaySection({ data, locName }: { data: OneCallResponse; locName: string }) {
  const { current, hourly, timezone_offset } = data;
  const windKmh = msToKmh(current.wind_speed);
  const ctx = buildCtx({
    tempC: current.temp,
    feelsLikeC: current.feels_like,
    weatherId: current.weather[0].id,
    main: current.weather[0].main,
    windKmh,
    hour: localHour(current.dt, timezone_offset),
  });
  const today = new Date((current.dt + timezone_offset) * 1000).toISOString().slice(0, 10);
  const quote = pickQuote(ctx, `${locName}-${today}-${current.weather[0].id}`);

  const chartData = hourly.slice(0, 8).map((h) => ({
    hour: `${localHour(h.dt, timezone_offset).toString().padStart(2, "0")}h`,
    temp: Math.round(h.temp),
    pop: Math.round(h.pop * 100),
  }));

  return (
    <section className="px-5">
      <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Now
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tracking-tight tabular-nums">
                {Math.round(current.temp)}°
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Feels like {Math.round(current.feels_like)}° · {current.weather[0].main}
            </p>
          </div>
          <WeatherIcon code={current.weather[0].icon} size={88} />
        </div>

        <p className="mt-4 text-sm italic text-foreground/70">"{quote}"</p>

        <div className="mt-4 flex items-center gap-2">
          <WindChip kmh={windKmh} showSpeed />
        </div>

        <div className="mt-6 -mx-2 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis yAxisId="pop" hide domain={[0, 100]} />
              <YAxis yAxisId="temp" hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) =>
                  name === "pop" ? [`${value}%`, "Rain"] : [`${value}°`, "Temp"]
                }
              />
              <Bar yAxisId="pop" dataKey="pop" fill="var(--chart-rain)" radius={[6, 6, 0, 0]} barSize={14} />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                stroke="var(--chart-temp)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-temp)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}