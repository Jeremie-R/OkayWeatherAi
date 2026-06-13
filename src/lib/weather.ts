export function windLabel(kmh: number): "Calm" | "Breezy" | "Windy" | "Storm" {
  if (kmh < 10) return "Calm";
  if (kmh < 25) return "Breezy";
  if (kmh < 50) return "Windy";
  return "Storm";
}

// OWM returns wind_speed in m/s when units=metric
export const msToKmh = (ms: number) => ms * 3.6;

export function moonPhaseName(phase: number): string {
  // 0 / 1 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  if (phase === 0 || phase === 1) return "New Moon";
  if (phase < 0.25) return "Waxing Crescent";
  if (phase === 0.25) return "First Quarter";
  if (phase < 0.5) return "Waxing Gibbous";
  if (phase === 0.5) return "Full Moon";
  if (phase < 0.75) return "Waning Gibbous";
  if (phase === 0.75) return "Last Quarter";
  return "Waning Crescent";
}

export function daysToFull(phase: number): number {
  const cycle = 29.53;
  const full = 0.5;
  let delta = full - phase;
  if (delta <= 0) delta += 1;
  return Math.round(delta * cycle);
}

export function moonIllumination(phase: number): number {
  // Cosine-based approximation; 0 at new, 100 at full
  return Math.round((1 - Math.cos(2 * Math.PI * phase)) * 50);
}

export function partOfDayRange(hour: number): "morning" | "afternoon" | "evening" | null {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return null;
}

export function formatTime(unix: number, tzOffset: number): string {
  const d = new Date((unix + tzOffset) * 1000);
  return d.toISOString().slice(11, 16);
}

export function localHour(unix: number, tzOffset: number): number {
  return new Date((unix + tzOffset) * 1000).getUTCHours();
}

export function localDayLabel(unix: number, tzOffset: number, idx: number): { short: string; date: string } {
  const d = new Date((unix + tzOffset) * 1000);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const short = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : dayNames[d.getUTCDay()];
  return { short, date: `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}` };
}