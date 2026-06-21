# Upcoming rain card

A new short-term ("next 60 min") rain card that appears between "Now" and "SUN" — only when rain is actually expected — and re-appears at the top of the day detail page with the same chart.

## Data source

OpenWeatherMap One Call 3.0 already powers the app and includes a `minutely` array: **60 entries, one per minute, each `{ dt, precipitation }` in mm/h**. We currently exclude it via `exclude=minutely,alerts` in `src/lib/owm.ts`. We will stop excluding it (keep `alerts` excluded) and surface it. No new API, no new key. If a given location returns no `minutely` block (OWM only provides it for supported regions), the card simply doesn't render.

## Trigger rule

Show the card only when **any of the next 60 minutes has `precipitation > 0`** (with a small floor, e.g. `>= 0.05 mm/h`, to ignore noise). Otherwise render nothing — no empty state.

## UI

### Card on the home page

- Placement: inside `TodaySection`'s parent layout in `src/routes/index.tsx`, rendered **between `TodaySection` and `SunMoonSection`**.
- New component `src/components/UpcomingRainSection.tsx`.
- Visual: same rounded card language as the other sections (`rounded-3xl bg-card border border-border/60 p-6 shadow-sm`).
- Header line: small uppercase eyebrow "Upcoming rain" + a one-line human summary (e.g. "Starts in ~8 min", "Easing off in ~20 min", "Light rain for the next hour").
- Body: a compact **area chart** (recharts `AreaChart` + `Area`) of mm/h over the next 60 minutes. X axis: minute offsets with sparse ticks ("now", "+15", "+30", "+45", "+60"). Y axis hidden. Uses existing `var(--chart-rain)` token with a soft gradient fill.
- Whole card is a `<button>` that calls `onOpenDay()` with index 0 (today), matching how `TodaySection` opens the day modal.

### Mirror in the day detail page

- In `DayDetailModal`, when `dayIndex === 0` AND the same trigger rule passes, render an `"Upcoming rain"` `ChartCard` near the top (right after the hero card, before "Across the day"). Same area chart, slightly taller. Other days never show it.

## Technical details

1. `src/lib/owm.ts`
   - Add `MinutelyPrecip { dt: number; precipitation: number }` and `minutely?: MinutelyPrecip[]` to `OneCallResponse`.
   - Change the URL to `exclude=alerts` (drop `minutely`).
2. `src/lib/weather.ts` (or co-located in the new component)
   - Helper `buildUpcomingRain(minutely, tzOffset)` returning `{ points: {minute:number; mm:number; label:string}[]; summary: string; hasRain: boolean }`. Summary derives "starts in N min" / "easing in N min" / "light rain continuing" from the series.
3. `src/components/UpcomingRainSection.tsx`
   - Props: `{ data: OneCallResponse; onOpenDay?: () => void }`. Returns `null` when `!hasRain`.
   - Uses `AreaChart`, `Area` with `type="monotone"`, `fillOpacity` gradient, no dots, light tooltip.
4. `src/routes/index.tsx`
   - Insert `<UpcomingRainSection data={query.data.owm} onOpenDay={() => setOpenDay(0)} />` between `TodaySection` and `SunMoonSection`.
5. `src/components/DayDetailModal.tsx`
   - When `dayIndex === 0` and `buildUpcomingRain(...)` reports rain, render a new `ChartCard title="Upcoming rain"` with the same area chart.

## Out of scope

- No new API providers, no map/radar imagery.
- No notifications/alerts.
- No changes to quotes, the 8-hour Today chart, or any other section's styling.
