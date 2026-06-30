import { Sunrise, Sunset } from "lucide-react";
import type { OneCallResponse } from "@/lib/owm";
import { moonPhaseName, moonIllumination, daysToFull, formatTime, moonEmoji } from "@/lib/weather";

/** Sun arc + sunrise/sunset times. Standalone, used inside larger cards. */
export function SunArc({
  sunrise,
  sunset,
  currentDt,
  tzOffset,
  showTitle = false,
}: {
  sunrise: number;
  sunset: number;
  currentDt: number | null;
  tzOffset: number;
  showTitle?: boolean;
}) {
  const dayStartUtc = sunrise - ((sunrise + tzOffset) % 86400);
  const pos = (t: number) => Math.max(0, Math.min(1, (t - dayStartUtc) / 86400));
  const sunrisePct = pos(sunrise) * 100;
  const sunsetPct = pos(sunset) * 100;
  const nowPct = currentDt != null ? pos(currentDt) * 100 : null;

  return (
    <div>
      {showTitle && (
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sun
        </p>
      )}
      <div className={`relative ${showTitle ? "mt-4" : ""} h-3 rounded-full bg-[var(--track-dusk)] overflow-visible`}>
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300"
          style={{ left: `${sunrisePct}%`, width: `${sunsetPct - sunrisePct}%` }}
        />
        {nowPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white border border-foreground/30 shadow-sm"
            style={{ left: `${nowPct}%` }}
            aria-label="now"
          />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sunrise className="h-3.5 w-3.5" />
          {formatTime(sunrise, tzOffset)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sunset className="h-3.5 w-3.5" />
          {formatTime(sunset, tzOffset)}
        </span>
      </div>
    </div>
  );
}

/** Full Sun arc + Moon row card body (no outer button/section wrapper). */
export function SunMoonCard({
  sunrise,
  sunset,
  currentDt,
  tzOffset,
  moonPhase,
}: {
  sunrise: number;
  sunset: number;
  currentDt: number | null;
  tzOffset: number;
  moonPhase: number;
}) {
  const phaseName = moonPhaseName(moonPhase);
  const illum = moonIllumination(moonPhase);
  const toFull = daysToFull(moonPhase);
  return (
    <div className="space-y-5">
      <SunArc sunrise={sunrise} sunset={sunset} currentDt={currentDt} tzOffset={tzOffset} showTitle />
      <div className="flex items-center gap-4 pt-2 border-t border-border/60">
        <span className="text-4xl leading-none" aria-label={phaseName}>
          {moonEmoji(moonPhase)}
        </span>
        <div>
          <p className="text-sm font-medium">{phaseName}</p>
          <p className="text-xs text-muted-foreground">
            {illum}% illuminated · {toFull === 0 ? "Full tonight" : `${toFull}d to full`}
          </p>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Home page now uses the unified TodaySection. Kept for compatibility. */
export function SunMoonSection({ data, onOpenDay }: { data: OneCallResponse; onOpenDay?: () => void }) {
  const { current, daily, timezone_offset } = data;
  return (
    <section className="px-5">
      <button
        onClick={onOpenDay}
        className="w-full rounded-3xl bg-card border border-border/60 p-6 shadow-sm text-left transition hover:bg-muted/40"
      >
        <SunMoonCard
          sunrise={current.sunrise}
          sunset={current.sunset}
          currentDt={current.dt}
          tzOffset={timezone_offset}
          moonPhase={daily[0].moon_phase}
        />
      </button>
    </section>
  );
}