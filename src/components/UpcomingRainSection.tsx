import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { OneCallResponse } from "@/lib/owm";
import { buildUpcomingRain } from "@/lib/upcomingRain";

export function UpcomingRainSection({
  data,
  onOpenDay,
}: {
  data: OneCallResponse;
  onOpenDay?: () => void;
}) {
  const rain = buildUpcomingRain(data.minutely, data.current.dt);
  if (!rain.hasRain) return null;

  return (
    <section className="px-5">
      <button
        onClick={onOpenDay}
        className="w-full rounded-3xl bg-card border border-border/60 p-6 shadow-sm text-left transition hover:bg-muted/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Upcoming rain
            </p>
            <p className="mt-1 text-base font-medium text-foreground">
              {rain.summary}
            </p>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            peak {rain.peakMm.toFixed(rain.peakMm >= 1 ? 1 : 2)} mm/h
          </span>
        </div>

        <div className="mt-4 -mx-2 h-28">
          <UpcomingRainChart points={rain.points} />
        </div>
      </button>
    </section>
  );
}

export function UpcomingRainChart({
  points,
}: {
  points: { minute: number; mm: number; label: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="upcomingRainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-rain)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--chart-rain)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="minute"
          type="number"
          domain={[0, 60]}
          ticks={[0, 15, 30, 45, 60]}
          tickFormatter={(v) => (v === 0 ? "now" : `+${v}`)}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <YAxis hide domain={[0, "dataMax + 0.2"]} />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.3 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontSize: 12,
          }}
          labelFormatter={(v: number) => (v === 0 ? "now" : `+${v} min`)}
          formatter={(v: number) => [`${v.toFixed(2)} mm/h`, "Rain"]}
        />
        <Area
          type="monotone"
          dataKey="mm"
          stroke="var(--chart-rain)"
          strokeWidth={2}
          fill="url(#upcomingRainFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}