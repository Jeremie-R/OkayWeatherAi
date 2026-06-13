## OkayWeather — build plan

A mobile-first, light/white, rounded one-pager that leans on your hand-made weather icons for personality. Built in Lovable on TanStack Start; connect to GitHub afterwards from the + menu.

### Data & APIs
- **OpenWeatherMap One Call 3.0** for current, hourly (8h), daily (10d), sunrise/sunset, moon phase, feels_like, wind, pop (rain probability).
- **OpenWeatherMap Geocoding API** (`/geo/1.0/direct`) for city search — returns name + country + lat/lon, free.
- API key shipped in client (per your call). I'll keep it in a single `src/lib/owm.ts` constant so it's easy to rotate later.
- Units: metric (°C, km/h). Easy to toggle later if you want.

### Icons
Unzip your `WeatherIcon/` set into `src/assets/weather-icons/` and map by OWM code (`01d`…`50n`). One helper `<WeatherIcon code="10d" size={...} />`. Moon phases get their own small SVG set (computed from One Call's `moon_phase` 0–1 → new/waxing crescent/first quarter/…/waning crescent).

### Funny quotes engine
File: `src/lib/quotes.ts`.
- Each quote: `{ text, rule: (ctx) => boolean, weight }`.
- `ctx` = `{ tempC, feelsLikeC, deltaFeel, condition, isRain, isSnow, isClear, isCloudy, windKmh, hour }`.
- Rule buckets seeded with ~8–12 lines each:
  - **Hot** (>28), **Cold** (<5), **Big feels-like gap** (|delta|≥4),
  - **Rain**, **Snow**, **Thunder**, **Fog/Mist**,
  - **Windy** (>30), **Perfect day** (clear, 18–24, low wind) — slightly complaining,
  - **Default fallback**.
- Selector: filter matching rules → pick weighted-random with a daily seed so the line is stable across reloads on the same day/location/condition (no AI calls).

### Sections (single scrolling page)

1. **Header / location**
   - Default: geolocation → reverse geocode for label. Fallback: last-used city from `localStorage`.
   - Tap location → opens a sheet with: search input + list of recent searches (stored in `localStorage`, max 8). Typing hits Geocoding API (debounced 250 ms), results show "City, Region, Country".

2. **Today**
   - Big temp + "feels like X°", weather icon, condition word, one funny quote underneath.
   - Wind row (low emphasis): small fan icon + "Calm / Breezy / Windy / Storm" + km/h subtle.
   - **Next-8h chart**: combined bars (rain probability %) + line (temp °) over 8 hourly points. Uses Recharts ComposedChart.

3. **Sun & Moon**
   - Horizontal 24h track with night-blue background. A lighter "day" bar spans sunrise→sunset. A pulsing dot marks "now". Labels: sunrise time / sunset time at the bar edges.
   - Below: moon icon + phase name + "% illuminated · X days to full".

4. **Tomorrow**
   - Three rounded cards: Morning (6–12), Afternoon (12–18), Evening (18–24). Aggregated from tomorrow's hourly slice.
   - Each: icon + temp (large), then small row: feels-like, rain %, wind chip (Calm / Windy / Storm).

5. **Next 10 days**
   - One row per day: short day name + date · icon · low–high temp · optional rain-% chip if pop ≥ 10%.
   - Tap a row (or any Tomorrow card) → **Day detail modal** with hour-by-hour list (icon, time, temp, feels, rain %, wind).

### Routing & structure
Single route `/` (TanStack Start). Modal handled via shadcn `Dialog`. Location sheet via shadcn `Sheet`.

```text
src/
  routes/index.tsx
  components/
    Header.tsx, LocationSheet.tsx
    TodaySection.tsx, HourlyChart.tsx
    SunMoonSection.tsx, SunTrack.tsx, MoonBadge.tsx
    TomorrowSection.tsx, PartOfDayCard.tsx
    TenDaySection.tsx, DayRow.tsx
    DayDetailModal.tsx
    WeatherIcon.tsx, WindChip.tsx
  lib/
    owm.ts        // fetchers + types
    quotes.ts     // rules + selector
    weather.ts    // helpers (windLabel, moonPhaseName, daysToFull, partsOfDay)
    geo.ts        // geocoding + recent-searches localStorage
  assets/weather-icons/*.svg
```

Data fetching via TanStack Query (`useQuery` keyed on lat/lon). Loading → skeletons; error → friendly retry card.

### Design
- Tailwind v4 tokens in `src/styles.css`: white background, soft `--muted` cards (`oklch(0.985 0.005 250)`), 1rem radius (rounded-2xl), subtle border. Typography: a clean modern sans (e.g. Manrope display + Inter body) loaded via `<link>` in `__root.tsx`.
- Mobile-first: max-width ~ 480 px column, generous padding, large numbers for temperatures.
- Motion: subtle fade-up on section mount via `motion/react` — nothing flashy.

### Known caveats I'll flag in code
- OWM key is public in the bundle (your choice). Add a code comment + README note to rotate it if quota gets hit.
- One Call 3.0 daily forecast goes 8 days by default; for "10 days" I'll request the max it returns and render whatever comes back (typically 8). I'll label the section "Next days" so it stays accurate.
- Moon "days to full" computed from current `moon_phase` value (29.53-day cycle).

### After you approve
I'll build everything end-to-end in one pass, then you can connect GitHub from the + menu to push to your `OkayWeatherAi` repo.
