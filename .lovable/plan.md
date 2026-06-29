
## 1. Hide the rain card when there's no rain

In `DayDetailModal.tsx`, only render the "Rain" `ChartCard` when there is at least one hour with `rain > 0` or `pop >= 25` for the selected day. (Upcoming-rain card is already conditional.)

## 2. Wind card: tier coloring, dynamic title, direction arrows

Our wind tiers (already defined in `src/lib/weather.ts`) are 4 levels:
- **Calm** (<10 km/h)
- **Breezy** (10–24)
- **Windy** (25–49)
- **Storm** (≥50)

Changes:
- **Card title**: replace "Wind (km/h)" with the day's dominant tier label, e.g. *"Breezy day"* / *"Windy day"* / *"Storm"* / *"Calm day"*. Computed from the daily average of the hourly buckets.
- **Bar color per tier (pastel, harmonized with current scheme)**: each bar is colored by its own bucket's tier so you can see the day evolve:
  - Calm → `--wind-calm` (very pale mint)
  - Breezy → `--wind-breezy` (soft sage)
  - Windy → `--wind-windy` (medium pastel green)
  - Storm → `--wind-storm` (deeper forest-pastel green)
  Tokens added in `src/styles.css` under `@theme`, in both light and dark variants. No hardcoded hex in components.
- **Wind direction arrows above bars**: use `OmHourly.windDeg` from Open-Meteo (already fetched). For each 2-hour bucket compute the average direction. Render a small arrow + cardinal label (N/NE/E/…) using a custom Recharts label on the Bar — but only when the direction *meaningfully changes* from the previously-shown arrow (≥ ~45° delta), and always show the first bucket. This keeps the row from getting busy. Arrow is a rotated `<Navigation />` lucide icon (or inline SVG) styled in muted foreground.

## 3. New "Today only" row: UV index + Air quality

Only shown for `dayIndex === 0` (today), placed above the Sun/Moon card. Two equal-width cards side-by-side.

**UV Index**
- Data source: already available in our OWM One Call response — `data.current.uvi` and `data.daily[0].uvi` (peak). Add `uvi` to the `OwmCurrent` and `OwmDaily` types in `src/lib/owm.ts`.
- Bucket: **Low** (<3) · **Moderate** (3–5) · **High** (6–7) · **Very High** (8–10) · **Extreme** (11+). Card shows: big level word ("Low" / "Moderate" / "High"…), numeric peak underneath ("peak 7"), and a 5-segment pill bar with the active tier highlighted using a token (`--uv-low`, `--uv-moderate`, `--uv-high`, `--uv-very-high`, `--uv-extreme`).

**Air quality (AQI)**
- Data source: not in our current calls. Add a new fetcher using **Open-Meteo Air Quality API** (free, no key, same provider we already use):
  `GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude=…&longitude=…&current=european_aqi&timezone=auto`
  Returned value `european_aqi` (0–100+).
- New helper: `src/lib/airquality.ts` exporting `fetchAirQuality(lat, lon)` returning `{ aqi: number }`.
- Wire into `src/routes/_tabs.index.tsx` `useQuery` via `Promise.all` next to OWM + Open-Meteo, passed down as `aqi` prop to `DayDetailModal`. Failures are non-fatal (returns `null`, card shows "Unavailable").
- Bucket (European AQI scale, mapped to the user's wording): **Good** (<20) · **Fair** (20–39) · **Passable** (40–59) · **Poor** (60–79) · **Hazardous** (80+). Same big-word + numeric + 5-segment pill bar treatment, using `--aqi-*` tokens.

## 4. Files to change

```text
src/lib/weather.ts           # add windTier() returning level + token name
src/lib/owm.ts               # add uvi to OwmCurrent & OwmDaily types
src/lib/airquality.ts        # NEW — Open-Meteo air quality fetcher
src/styles.css               # add --wind-*, --uv-*, --aqi-* design tokens
src/routes/_tabs.index.tsx   # fetch AQI alongside weather, pass to modal
src/components/DayDetailModal.tsx
                              # - hide rain card when dry
                              # - wind card: tier title, per-bar tier color,
                              #   direction arrows on meaningful change
                              # - today-only UV + AQI row (new sub-components)
```

No business-logic changes outside the day detail flow; everything else (Today section, 10-day list, alerts) is untouched.
