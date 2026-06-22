## Goal

When a location has multiple weather alerts, stop stacking individual rails. Show one rail summarizing the count, and when tapped, open a single page listing every alert's full text.

## Changes

### 1. `src/components/AlertRail.tsx`
- Render exactly one rail regardless of count.
- 1 alert → label shows the event name (current behavior).
- 2+ alerts → label shows "N weather alerts" (e.g. "3 weather alerts"), drop the sender suffix.
- `onOpen` becomes a zero-arg callback (no index needed) since tapping always opens the combined view.

### 2. `src/components/AlertDetailModal.tsx`
- Switch from "single alert by index" to "all alerts list".
- Props: `alerts: OwmAlert[] | null`, `open: boolean`, `tzOffset`, `onClose`.
- Header title: "Weather alert" for one, "N weather alerts" for many.
- Body: render each alert as its own card stacked vertically — event title, issuer, time range, tags, then full `description`. Reuse the existing card styling so a single-alert view looks identical to today.

### 3. `src/routes/_tabs.index.tsx`
- Replace `openAlert: number | null` with `alertsOpen: boolean`.
- `<AlertRail ... onOpen={() => setAlertsOpen(true)} />`
- `<AlertDetailModal alerts={...} open={alertsOpen} tzOffset={...} onClose={() => setAlertsOpen(false)} />`

## Out of scope

No changes to alert fetching, deduping logic, or styling tokens. Pure UI restructure of the rail + modal.
