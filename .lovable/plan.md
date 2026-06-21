## Fix the three Map-tab bugs

### 1. Start at a supported radar zoom and clamp it

RainViewer radar tiles render reliably only at roughly z=4–8; the current map opens at z=8 with `maxZoom: 10`, so the radar overlay disappears (or shows stretched/empty tiles) whenever the user zooms in.

In `src/components/MapPrecipitation.tsx`:
- Change the Leaflet map options to `zoom: 6`, `minZoom: 4`, `maxZoom: 8` (last value that radar supports cleanly).
- Drop the conflicting `maxZoom: 12` on the radar `TileLayer` and the `maxZoom: 19` on the CARTO basemap layer — let the map's own `maxZoom` govern, so the user can never reach an unsupported level.

### 2. Fix the location-sheet z-index conflict

Leaflet's panes/controls render at `z-index: 400–700`, which sits above the Radix Sheet overlay/content (z=50). When the user opens the location switcher on the Map tab, the map shows through and above the modal.

Fix in `src/components/MapPrecipitation.tsx` by scoping the leaflet stacking context: add `relative isolate z-0` to the map wrapper and a small CSS override so `.leaflet-pane`, `.leaflet-top`, `.leaflet-bottom` get `z-index: auto` (or ≤10) within that container. The Sheet overlay (z=50) then correctly covers the map.

### 3. Slider future range + fallback

Two related problems:
- Visually the slider only shows past time. The `range` input is fine; the issue is the initial position is set to `nowIndex - 1` (the last past frame), so the "now" tick and the thumb sit near the right edge and the nowcast portion looks like an empty sliver. Initialize `frameIdx` to `nowIndex` so the thumb starts at "now" with future frames visibly available to the right.
- When RainViewer returns no `nowcast` frames for the area (it happens — coverage is not global for the nowcast layer), there is literally no future to scrub. Add an explicit fallback.

Changes:
- `src/routes/_tabs.map.tsx`: initialize/reset `frameIdx` to `q.data.nowIndex` (clamped to the last frame).
- `src/components/TimeSlider.tsx`: add a small badge "Past only — no nowcast for this area" when `frames[frames.length - 1].time <= nowFrame.time` (i.e. zero future frames). The slider still works for the past window.
- Also tighten the slider styles so the track is full-width and the "now" tick is clearly visible (taller line, slightly stronger color), making the past/future split obvious.

### Out of scope

No changes to RainViewer fetching, no new layers, no routing changes. Weather tab untouched.

### Files touched

- `src/components/MapPrecipitation.tsx` — zoom config, z-index isolation.
- `src/routes/_tabs.map.tsx` — initial frame index at "now".
- `src/components/TimeSlider.tsx` — fallback badge, tick styling.
