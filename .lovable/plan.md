# Extend day-detail hourly data to all 10 days via Open-Meteo

## Goal
Day-detail pages currently only have real hourly data for today and tomorrow (OWM One Call gives 48h). For days 3–10 the charts silently break. Fix by sourcing hourly data from **Open-Meteo** (free, no key, no signup, 16-day hourly) and keeping the existing 12 × 2-hour column layout on every day page.

## Approach

OWM stays the primary source for everything else (today card, tomorrow card, sun/moon, 10-day summary list, current conditions). Open-Meteo is added as a second source used **only** to power the hourly charts inside the day-detail overlay.

Single fetch per app load: when we load OWM, we also load a full 10-day hourly Open-Meteo response for the same coordinates and cache it. Opening any day page then just slices the cached array by date — no extra request per day.

For consistency, today and tomorrow also switch to Open-Meteo for the day-detail charts (so all 10 day pages render from the same data shape and look identical). The main "Today" section on the home page keeps using OWM — no change there.

## Changes

### Data layer
- `src/lib/openmeteo.ts` (new): typed fetcher for Open-Meteo's `/v1/forecast` endpoint. Request hourly fields: `temperature_2m`, `apparent_temperature`, `precipitation`, `precipitation_probability`, `weathercode`, `wind_speed_10m`, `wind_gusts_10m`, `wind_direction_10m`, `is_day`. Params: `forecast_days=10`, `timezone=auto`, `wind_speed_unit=ms`. Returns a flat array of hourly points with a JS `Date`.
- `src/lib/weather.ts`: extend the shared `WeatherData` type with an `openMeteoHourly` field (array of hourly points). Add a helper `getHoursForDay(hourly, dayIndex, tzOffsetSec)` that returns the 24 hours belonging to a given local day.
- Weather code mapping helper: small function mapping Open-Meteo WMO codes → existing OWM icon codes (e.g. `01d`, `10n`, `13d`) so `WeatherIcon` keeps working unchanged. Day/night decided from `is_day`.

### Fetch wiring
- Wherever OWM One Call is fetched today (root loader / query), fire Open-Meteo in parallel with `Promise.all`. Attach result to the same query data object. If Open-Meteo fails, day pages 3–10 degrade gracefully (charts show "Hourly forecast unavailable" placeholder); OWM-driven UI is unaffected.

### Day detail overlay
- `src/components/DayDetailModal.tsx`: replace the current OWM-hourly source with `openMeteoHourly` for **all** day indices (0–9). Keep the existing `bucketHours` logic that averages into 12 × 2h columns — it already works on any 24-point hourly array. Inputs change:
  - temperature/feels-like → from `temperature_2m` / `apparent_temperature`
  - rain chart → from `precipitation` (mm) + `precipitation_probability`
  - wind chart → from `wind_speed_10m` + `wind_gusts_10m` + `wind_direction_10m`
  - per-column weather icon → from mapped `weathercode` + `is_day`
- Remove the now-unused OWM hourly slicing path inside the modal.

### Cleanup
- Keep `owm.ts` hourly types intact (still used by the home `TodaySection` chart). No changes to TodaySection, TomorrowSection, SunMoonSection, TenDaySection, Header, LocationSheet.

## Technical notes
- Open-Meteo endpoint: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,weathercode,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day&forecast_days=10&timezone=auto&wind_speed_unit=ms`
- No API key, no auth header, generous free limits — safe to call from the browser.
- Day grouping uses the `timezone=auto` offset returned by Open-Meteo (`utc_offset_seconds`) so local-midnight boundaries match what the user sees, regardless of their device timezone.
- 12 × 2h buckets: pair hours `[0,1]`, `[2,3]`, … `[22,23]`. Temperature/feels-like = mean; rain mm = sum; rain probability = max; wind speed/gusts = mean; wind dir = vector-averaged; icon = mode of mapped codes.

## Out of scope
- No changes to OWM key handling, no new secrets.
- No UI/layout changes to existing cards or the modal shell — only the data feeding the 3 charts changes.
- No caching layer beyond the existing query — one Open-Meteo call per location load.
