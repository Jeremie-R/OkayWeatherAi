## Add weather alert rail

OpenWeather's One Call 3.0 already returns an `alerts` array on the same response we fetch — we just need to stop excluding it and surface it in the UI.

### Data

`src/lib/owm.ts`
- Add `OwmAlert` interface: `sender_name: string; event: string; start: number; end: number; description: string; tags: string[]`.
- Add `alerts?: OwmAlert[]` to `OneCallResponse`.
- Change fetch URL `exclude=alerts` → `exclude=` (we already kept minutely; now keep alerts too).

### Alert rail (home)

New `src/components/AlertRail.tsx`
- Props: `alerts?: OwmAlert[]`, `onOpen: (index: number) => void`.
- Returns `null` if no alerts.
- Renders a short, single-line pill above the Now card:
  - Subtle light surface in line with our cards: `rounded-2xl border border-border/60 bg-muted/40` (no heavy color), small triangle alert icon (`lucide-react` `AlertTriangle`) in `text-foreground/70`.
  - Text: the alert `event` (e.g. "Yellow wind warning"), truncated with `truncate`, plus a tiny `chevron-right`.
  - Sender shown as a faint suffix only if room (`text-muted-foreground`).
  - Full-width button, `h-11`, horizontal padding to match other sections (`mx-5`).
- If multiple alerts: render one pill per alert, stacked with `space-y-2` (keeps it subtle, no carousel).

Insert in `src/routes/index.tsx` directly above `<TodaySection>`:
```
<AlertRail alerts={query.data.owm.alerts} onOpen={(i) => setOpenAlert(i)} />
```

### Alert detail "page"

The app is a single route with overlay modals (see `DayDetailModal`). Match that pattern so back/exit behavior is consistent.

New `src/components/AlertDetailModal.tsx`
- Props: `alerts: OwmAlert[] | null; index: number | null; onClose: () => void`.
- Full-screen sheet identical in framing to `DayDetailModal`: same header with a back chevron (`onClose`) and title = alert `event`, content scrolls.
- Body:
  - Sender (`sender_name`), small muted.
  - Effective window: formatted `start` – `end` in the location's local time (reuse helpers in `weather.ts` if available, otherwise inline `Intl.DateTimeFormat`).
  - Tags as small pill chips (if any).
  - Full `description` rendered as `whitespace-pre-wrap` paragraph (OWM descriptions contain newlines and are plain text).
- Esc / back chevron / backdrop click all call `onClose`, mirroring `DayDetailModal`.

Wire in `src/routes/index.tsx`:
- `const [openAlert, setOpenAlert] = useState<number | null>(null);`
- Render `<AlertDetailModal alerts={query.data?.owm.alerts ?? null} index={openAlert} onClose={() => setOpenAlert(null)} />` next to `DayDetailModal`.

### Out of scope
- No new providers, no notifications, no severity color coding beyond a single subtle icon, no changes to other sections.

### Notes
- "Page" is implemented as a full-screen overlay to match the existing `DayDetailModal` pattern (this app has a single route). If you'd rather have a real `/alerts/$index` route, say so and I'll switch the plan.
