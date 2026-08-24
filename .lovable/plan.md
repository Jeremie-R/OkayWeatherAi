# Weather quotes: editable working doc

Goal: get every quote out of the code into a plain-text doc you can edit by hand, then sync your edits back into the app.

## Step 1 — Export

Generate `/mnt/documents/weather-quotes.md`, downloadable from chat. Structure:

```text
## rain  (rule: it is raining · weight 2)
- Rain. Because of course.
- It's raining. Hair plans cancelled.
...
```

- One section per rule bucket, in the same order as the app: feels-like gap, extreme heat (>=38), hot (>=33), hot + clear (>=28), cold (<5), extreme cold (<-12), low feels-like (<=-5), chilly + windy, rain, snow, thunder, fog, wind >=40, wind 30-50, perfect day, cloudy, default.
- Each section header states the trigger condition in plain English plus its weight, so you know when a line will show.
- One quote per line as a `-` bullet, exactly as it appears today (including the empty placeholder slots, which are dropped).
- A short legend at the top listing the placeholders you can use: `{temp}`, `{feels}`, `{wind}`.

## Step 2 — You edit

Edit freely: add, delete, reword, move lines between sections. Keep the `##` section headers intact so the sync knows where each line belongs. Adding a brand-new bucket is fine too — just say what should trigger it.

## Step 3 — Sync back

Hand the edited file back (upload or paste). I rewrite the `texts` arrays in `src/lib/quotes.ts` to match it exactly, leaving the rules and weights untouched unless you asked for changes, then typecheck.

## Technical notes

- Source of truth stays `src/lib/quotes.ts`; the doc is a round-trip format, not a runtime file. No database or storage is added.
- Export is done with a throwaway script that parses the existing `texts` arrays, so nothing is retyped by hand and no quote is lost.
- Selection logic (`pickQuote`, weights, first-match-wins ordering) is not changed.
