import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import { WeatherIcon } from "./WeatherIcon";
import { WindChip } from "./WindChip";
import type { OneCallResponse } from "@/lib/owm";
import { buildCtx, pickQuote } from "@/lib/quotes";
import { localHour, msToKmh } from "@/lib/weather";

export function TodaySection({ data, locName, onOpenDay }: { data: OneCallResponse; locName: string; onOpenDay?: () => void }) {
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

  const slice = hourly.slice(0, 8);
  const temps = slice.map((h) => Math.round(h.temp));
  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const minIdx = temps.indexOf(tMin);
  const maxIdx = temps.indexOf(tMax);
  const chartData = slice.map((h, i) => ({
    hour: `${localHour(h.dt, timezone_offset).toString().padStart(2, "0")}h`,
    temp: temps[i],
    rain: +(h.rain?.["1h"] ?? 0).toFixed(2),
    label: i === minIdx ? `${tMin}°` : i === maxIdx ? `${tMax}°` : "",
  }));
  const hasRain = chartData.some((d) => d.rain > 0);

  return (
    <section className="px-5">
      <button
        onClick={onOpenDay}
        className="w-full rounded-3xl bg-card border border-border/60 p-6 shadow-sm text-left transition hover:bg-muted/40"
      >
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
              <YAxis yAxisId="rain" hide domain={[0, "dataMax + 0.5"]} />
              <YAxis yAxisId="temp" hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) =>
                  name === "rain" ? [`${value} mm`, "Rain"] : [`${value}°`, "Temp"]
                }
              />
              <Bar
                yAxisId="rain"
                dataKey="rain"
                fill="var(--chart-rain)"
                radius={[6, 6, 0, 0]}
                barSize={14}
                opacity={hasRain ? 0.9 : 0}
              />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                stroke="var(--chart-temp)"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "var(--background)", stroke: "var(--chart-temp)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--background)", stroke: "var(--chart-temp)", strokeWidth: 2 }}
              >
                <LabelList
                  dataKey="label"
                  position="top"
                  offset={10}
                  style={{
                    fill: "var(--foreground)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </button>
    </section>
  );
}