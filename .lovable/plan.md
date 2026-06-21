## Goal

Refactor `src/lib/quotes.ts` so each rule owns a **pool of interchangeable variants** instead of a single line, switch picking to **truly random** (no seed), and add **one new quote bucket** (with several variants) for a condition not yet covered.

## Changes (single file: `src/lib/quotes.ts`)

### 1. Reshape the data structure

Replace the flat `Quote[]` with a `QuoteRule[]`, where each rule groups multiple text variants:

```ts
interface QuoteRule {
  texts: string[];          // pool of interchangeable variants for this rule
  rule: (c: QuoteCtx) => boolean;
  weight?: number;          // rule-level weight (unchanged semantics)
}
```

Every existing quote stays — they get regrouped by rule. Example:

```ts
{
  texts: [
    "It's {temp}°. Even the pigeons are taking shade.",
    "Officially {temp}°. Unofficially: soup.",
    "Hot enough to fry an egg on your phone case.",
  ],
  rule: (c) => c.tempC >= 30,
  weight: 3,
},
```

Groupings preserve current trigger thresholds. Where existing quotes had slightly different thresholds within the same theme (e.g. hot at ≥30 vs ≥32 vs ≥33), the rule uses the **loosest** threshold so no quote becomes unreachable; stricter ones are folded into the same pool. Same approach for the cold, rain, snow, thunder, fog, wind, perfect-day, cloudy, feels-like-gap, and default buckets.

### 2. Truly random selection

- Drop `hashSeed` and `seedKey`. New signature: `pickQuote(ctx: QuoteCtx): string`.
- Rule selection: weighted pick over matching rules using `Math.random()`.
- Variant selection within the chosen rule: uniform `Math.random()` over `texts`.
- Update `src/components/TodaySection.tsx` (the only caller) to drop the seed argument.

### 3. New quote bucket

Add a new rule for **chilly + windy** ("biting wind" — not currently covered; today's cold bucket ignores wind, and the wind bucket ignores temperature):

```ts
{
  texts: [
    "{temp}° with {wind} km/h of wind. That's the cold doing cardio.",
    "Wind chill says hi. {feels}° and rude about it.",
    "Bundle up — the wind is editorializing.",
  ],
  rule: (c) => c.tempC <= 8 && c.windKmh >= 25,
  weight: 3,
},
```

### Out of scope

- No UI changes beyond removing the seed argument at the call site.
- No changes to `buildCtx` or `QuoteCtx`.
- No new files, no dependency changes.
