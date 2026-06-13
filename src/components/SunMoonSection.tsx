import { Sunrise, Sunset } from "lucide-react";
import type { OneCallResponse } from "@/lib/owm";
import { moonPhaseName, moonIllumination, daysToFull, formatTime } from "@/lib/weather";

export function SunMoonSection({ data }: { data: OneCallResponse }) {
  const { current, daily, timezone_offset } = data;
  const sunrise = current.sunrise;
  const sunset = current.sunset;
  // Position along the 24h local-day track
  const dayStartUtc = sunrise - ((sunrise + timezone_offset) % 86400);
  const pos = (t: number) => Math.max(0, Math.min(1, (t - dayStartUtc) / 86400));
  const sunrisePct = pos(sunrise) * 100;
  const sunsetPct = pos(sunset) * 100;
  const nowPct = pos(current.dt) * 100;

  const phase = daily[0].moon_phase;
  const phaseName = moonPhaseName(phase);
  const illum = moonIllumination(phase);
  const toFull = daysToFull(phase);

  return (
    <section className="px-5">
      <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sun
          </p>
          <div className="relative mt-4 h-10 rounded-full bg-[oklch(0.22_0.05_265)] overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300"
              style={{ left: `${sunrisePct}%`, width: `${sunsetPct - sunrisePct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-foreground shadow"
              style={{ left: `${nowPct}%` }}
              aria-label="now"
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Sunrise className="h-3.5 w-3.5" />
              {formatTime(sunrise, timezone_offset)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sunset className="h-3.5 w-3.5" />
              {formatTime(sunset, timezone_offset)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-border/60">
          <MoonIcon phase={phase} />
          <div>
            <p className="text-sm font-medium">{phaseName}</p>
            <p className="text-xs text-muted-foreground">
              {illum}% illuminated · {toFull === 0 ? "Full tonight" : `${toFull}d to full`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MoonIcon({ phase }: { phase: number }) {
  // SVG with masked illumination
  const r = 18;
  // Compute terminator: x-offset of the inner circle
  const k = Math.cos(phase * 2 * Math.PI);
  const offset = k * r;
  const waxing = phase < 0.5;
  return (
    <svg width="44" height="44" viewBox="-22 -22 44 44" aria-hidden>
      <circle r={r} fill="oklch(0.22 0.05 265)" />
      {/* lit area: intersection of full disc and big offset disc */}
      <defs>
        <clipPath id="moon-disc">
          <circle r={r} />
        </clipPath>
      </defs>
      <g clipPath="url(#moon-disc)">
        <circle
          cx={waxing ? -offset : offset}
          r={r}
          fill="oklch(0.95 0.02 90)"
        />
        <circle
          cx={waxing ? offset : -offset}
          r={r}
          fill="oklch(0.22 0.05 265)"
        />
      </g>
    </svg>
  );
}