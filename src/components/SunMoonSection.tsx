import { Sunrise, Sunset } from "lucide-react";
import type { OneCallResponse } from "@/lib/owm";
import { moonPhaseName, moonIllumination, daysToFull, formatTime, moonEmoji } from "@/lib/weather";

export function SunMoonSection({ data, onOpenDay }: { data: OneCallResponse; onOpenDay?: () => void }) {
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
      <button
        onClick={onOpenDay}
        className="w-full rounded-3xl bg-card border border-border/60 p-6 shadow-sm space-y-5 text-left transition hover:bg-muted/40"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sun
          </p>
          <div className="relative mt-4 h-3 rounded-full bg-[var(--track-dusk)] overflow-visible">
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300"
              style={{ left: `${sunrisePct}%`, width: `${sunsetPct - sunrisePct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white border border-foreground/30 shadow-sm"
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
          <span className="text-4xl leading-none" aria-label={phaseName}>
            {moonEmoji(phase)}
          </span>
          <div>
            <p className="text-sm font-medium">{phaseName}</p>
            <p className="text-xs text-muted-foreground">
              {illum}% illuminated · {toFull === 0 ? "Full tonight" : `${toFull}d to full`}
            </p>
          </div>
        </div>
      </button>
    </section>
  );
}