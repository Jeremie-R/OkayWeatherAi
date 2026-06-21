Update the empty-nowcast fallback message in the Map tab so it says "Predictions unavailable — showing past radar only." instead of "Nowcast unavailable for this area — showing past radar only."

### Files to change
1. `src/components/TimeSlider.tsx`
   - Locate the fallback banner shown when `hasFuture` is false.
   - Replace the banner text with the new copy.

No other UI, API, or routing changes are required.