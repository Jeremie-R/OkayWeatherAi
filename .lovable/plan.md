## Goal
Reorganize the home page and day detail page for better grouping and consistency.

---

## 1. Day page — full Sun + Moon card

Replace the condensed Sun/Moon mini row in `DayDetailModal.tsx` (the small flex card with sunrise/sunset times and a tiny moon emoji) with the **same full card used on the home page** (`SunMoonSection`-style): the day-arc track with sunrise/sunset endpoints, the "now" dot when viewing today (omitted on other days), and the full moon row underneath (emoji + phase name + illumination % + days-to-full).

- Extract the visual into a reusable presentational component, e.g. `SunMoonCard` (no button wrapper, accepts `sunrise`, `sunset`, `currentDt | null`, `tzOffset`, `moonPhase`).
- `SunMoonSection` (home) wraps it in the existing `<button onClick={onOpenDay}>` and passes `data.current.dt`.
- `DayDetailModal` renders the same card, passing `currentDt = null` for non-today days so the "now" dot is hidden.

---

## 2. Now card chart — weather icons under hours

In `TodaySection.tsx`, under the X-axis labels of the 8-hour chart, add a 8-column row of weather icons aligned to columns. Show an icon **only when the icon code changes from the previous hour**, with the first hour always shown and the last hour always shown. In between, empty slots stay blank.

---

## 3. Home page — unify "Now" + "Upcoming rain" + "Sun/Moon" into one card

Single card on the home page containing, in order:
1. Now header (temp, feels like, condition, big icon)
2. Quote
3. Wind chip
4. Temperature + rain chart (with new icons row from #2)
5. Separator line (`border-t border-border/60`)
6. **If upcoming rain exists:** small "Upcoming rain" header + summary + area chart; then another separator
7. Sun arc track with sunrise icon on the left endpoint and sunset icon on the right endpoint (no "SUN" title above it). The current sun-row already shows the icons under the bar; keep just that and drop the section title.
8. **Moon is removed from the home card** (still shown on the day page via #1).

Implementation:
- Merge `TodaySection` + `UpcomingRainSection` + `SunMoonSection` into one card inside a new `TodayCard` (or extend `TodaySection`). The whole card remains a single button navigating to today's day page (`onOpenDay`).
- Remove `<UpcomingRainSection />` and `<SunMoonSection />` calls from `src/routes/_tabs.index.tsx`.
- Keep `UpcomingRainChart` exported (still used by `DayDetailModal`).
- Keep `SunMoonSection` file but home no longer uses it as a separate section — the new `SunMoonCard` extracted in #1 is reused inside the unified Now card for the sun arc portion.

---

## 4. Tomorrow section — bento layout

Refactor `TomorrowSection.tsx` from 3 separate cards into **one card** with a separator-based bento layout:

```text
+----------------------------------------+
| Tomorrow                               |
+----------------------------------------+
| Morning   |  Afternoon  |  Evening    |
|  icon     |   icon      |   icon      |
|  22°      |   26°       |   21°       |
+----------------------------------------+
|        Rain 40%   ·   Wind chip        |
+----------------------------------------+
```

- Top row: 3 equal columns, each just `WeatherIcon` + temperature. No "feels like", no per-bucket pop/wind.
- Horizontal separator (`border-t border-border/60`).
- Bottom row: day-level rain probability (average of all tomorrow hours) and the day's `WindChip` (average wind, km/h).
- Whole card is clickable → opens `onOpenDetails(1)`.
- Section heading "Tomorrow" stays outside (as today) for consistency.

---

## Files affected
- `src/components/SunMoonSection.tsx` — extract `SunMoonCard` subcomponent.
- `src/components/TodaySection.tsx` — add icon row under chart; merge in upcoming-rain + sun arc rendering.
- `src/components/UpcomingRainSection.tsx` — keep `UpcomingRainChart` export, remove the section component (or leave unused).
- `src/components/TomorrowSection.tsx` — bento rewrite.
- `src/components/DayDetailModal.tsx` — replace mini sun/moon row with full `SunMoonCard`.
- `src/routes/_tabs.index.tsx` — drop `<UpcomingRainSection />` and `<SunMoonSection />` from layout.

No business-logic changes. No new dependencies.
