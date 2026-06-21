
## Feasibility

Feasible with free APIs, no key required.

- **RainViewer public API** (`api.rainviewer.com/public/weather-maps.json`) returns a list of radar tile timestamps: ~**past 2 hours** + a **nowcast of ~30 minutes ahead**.
- We render the radar as a tile overlay on top of a minimal base map. Radar tiles encode precipitation as colored pixels; at city zoom they read as the soft blue blobs you described.
- Slider range follows the API: roughly **−120 min … now … +30 min**. Exact endpoints depend on what RainViewer returns at any given moment — we'll always show the full window the API provides.

## Two tabs

A sticky bottom tab bar with two tabs:

```text
┌─────────────────────────────┐
│ (active screen)             │
│                             │
├─────────────────────────────┤
│   ☀ Weather    🗺 Map       │
└─────────────────────────────┘
```

- **Weather** — current screen, unchanged.
- **Map** — new screen described below.

Routing: a pathless layout route `src/routes/_tabs.tsx` renders the tab bar + `<Outlet />`. Existing `index.tsx` moves to `_tabs.index.tsx` (URL stays `/`). New `_tabs.map.tsx` is `/map`. Tabs use `<Link>` with `activeProps` for the active state.

## Map screen

```text
┌─────────────────────────────┐
│ Header: "Amsterdam · Map"   │
├─────────────────────────────┤
│                             │
│    minimal bicolor map      │
│    with blue precip blobs   │
│    pin marks current loc    │
│                             │
├─────────────────────────────┤
│ -120m ────────●──────── +30m│
│         12:34 (now)         │
│      ▶ play / pause         │
└─────────────────────────────┘
```

- **Base map**: Leaflet + CARTO Positron tiles (free, attribution required, soft gray-on-white — matches our minimal aesthetic). Centered on active location, zoom locked to a city-scale range (z=6–10).
- **Radar overlay**: a single Leaflet `TileLayer` whose URL swaps as the slider moves. RainViewer pattern: `{host}/v2/radar/{path}/256/{z}/{x}/{y}/{color}/{options}.png`. Color scheme `2` (universal blue), smooth on, snow on — so it reads as soft blue blobs on the light map.
- **Slider**: ticks are the RainViewer frame timestamps. Drag = scrub time. Endpoints are the actual min/max timestamps the API returns (typically −120 / +30 min around now). A "now" marker sits at the boundary between past and nowcast frames; the label shows the current frame's time in the location's timezone.
- **Play button**: advances one frame every ~500 ms and loops. Drag interrupts it.
- **Pin**: small dot at current location as a spatial anchor.

## Data flow

- New `src/lib/rainviewer.ts`: `fetchRainViewerFrames()` returns `{ host, frames: { time: number; path: string; kind: "past" | "nowcast" }[], nowIndex: number }`. Cached 5 min via React Query.
- Map screen reads location from the same `getLast()` source the weather screen uses — tabs stay in sync without any global state.
- All radar data from RainViewer; OpenWeatherMap key stays untouched.

## Dependencies

- `leaflet`, `react-leaflet`, `@types/leaflet`. Leaflet CSS loaded via a `<link>` tag in `src/routes/__root.tsx` (per Tailwind v4 rule on remote stylesheets).

## Files

- `src/lib/rainviewer.ts` (new) — fetch + types + frame window.
- `src/components/MapPrecipitation.tsx` (new) — Leaflet map + radar tile layer + pin. Client-only (lazy import).
- `src/components/TimeSlider.tsx` (new) — slider, play/pause, time label, now marker.
- `src/components/TabBar.tsx` (new) — sticky bottom bar with the two `<Link>`s.
- `src/routes/_tabs.tsx` (new) — layout route: `<Outlet />` + `<TabBar />`.
- `src/routes/_tabs.index.tsx` (new) — current home content, moved from `index.tsx`.
- `src/routes/_tabs.map.tsx` (new) — Header + MapPrecipitation + TimeSlider.
- `src/routes/index.tsx` — deleted (replaced by `_tabs.index.tsx`).

## Out of scope

- No SSR for the map (Leaflet is client-only; lazy-loaded).
- No wind/temperature overlays, no layer toggle — precipitation only.
- No swipe gestures between tabs; tap-only.
