export interface QuoteCtx {
  tempC: number;
  feelsLikeC: number;
  deltaFeel: number; // feels - real
  condition: string; // OWM main: Clear, Clouds, Rain, Snow, Thunderstorm, Drizzle, Mist, ...
  isRain: boolean;
  isSnow: boolean;
  isThunder: boolean;
  isClear: boolean;
  isCloudy: boolean;
  isFog: boolean;
  windKmh: number;
  hour: number;
}

interface Quote {
  text: string;
  rule: (c: QuoteCtx) => boolean;
  weight?: number;
}

const QUOTES: Quote[] = [
  // Big feels-like gap (priority)
  { text: "Says {temp}° but your skin filed a complaint at {feels}°.", rule: (c) => Math.abs(c.deltaFeel) >= 4, weight: 3 },
  { text: "On paper: {temp}°. In real life: {feels}°. Trust the body.", rule: (c) => Math.abs(c.deltaFeel) >= 5, weight: 3 },
  { text: "Thermometer is lying. It actually feels like {feels}°.", rule: (c) => Math.abs(c.deltaFeel) >= 4, weight: 2 },

  // Hot
  { text: "It's {temp}°. Even the pigeons are taking shade.", rule: (c) => c.tempC >= 30, weight: 3 },
  { text: "Officially {temp}°. Unofficially: soup.", rule: (c) => c.tempC >= 32, weight: 3 },
  { text: "Sunscreen called. It wants reinforcements.", rule: (c) => c.tempC >= 28 && c.isClear, weight: 2 },
  { text: "Hot enough to fry an egg on your phone case.", rule: (c) => c.tempC >= 33, weight: 2 },

  // Cold
  { text: "{temp}°. Your nose is officially a popsicle.", rule: (c) => c.tempC <= 0, weight: 3 },
  { text: "It's {temp}°. Layer like an onion, complain like a Parisian.", rule: (c) => c.tempC < 5, weight: 3 },
  { text: "Cold enough to make your coffee feel personal.", rule: (c) => c.tempC < 3, weight: 2 },
  { text: "{feels}°? That's not weather, that's a personal attack.", rule: (c) => c.feelsLikeC <= -5, weight: 3 },

  // Rain
  { text: "Rain. Because of course.", rule: (c) => c.isRain, weight: 2 },
  { text: "It's raining. Hair plans cancelled.", rule: (c) => c.isRain, weight: 2 },
  { text: "Bring an umbrella. Lose an umbrella. Tradition.", rule: (c) => c.isRain, weight: 2 },
  { text: "Liquid sunshine, if you're an optimist.", rule: (c) => c.isRain, weight: 1 },

  // Snow
  { text: "Snow! It's pretty for the first 12 minutes.", rule: (c) => c.isSnow, weight: 3 },
  { text: "Snow day. Drive like everyone forgot how cars work.", rule: (c) => c.isSnow, weight: 2 },

  // Thunder
  { text: "Thunder. The sky is in a mood.", rule: (c) => c.isThunder, weight: 3 },
  { text: "Storm incoming. Unplug something dramatic.", rule: (c) => c.isThunder, weight: 2 },

  // Fog
  { text: "Fog. Visibility: vibes only.", rule: (c) => c.isFog, weight: 3 },

  // Windy
  { text: "Wind at {wind} km/h. Hold onto your hat. And your dog.", rule: (c) => c.windKmh >= 40, weight: 3 },
  { text: "Windy. Hair will not survive this commute.", rule: (c) => c.windKmh >= 30 && c.windKmh < 50, weight: 2 },

  // Perfect day (slightly complaining)
  { text: "Annoyingly perfect. {temp}° and not a cloud to blame.", rule: (c) => c.isClear && c.tempC >= 18 && c.tempC <= 24 && c.windKmh < 20, weight: 3 },
  { text: "Suspiciously nice out. What does it want?", rule: (c) => c.isClear && c.tempC >= 19 && c.tempC <= 25, weight: 2 },
  { text: "{temp}° and sunny. Show-off weather.", rule: (c) => c.isClear && c.tempC >= 20 && c.tempC <= 26, weight: 2 },

  // Cloudy mild
  { text: "Grey, mild, forgettable. The default.", rule: (c) => c.isCloudy && c.tempC > 10 && c.tempC < 22, weight: 1 },
  { text: "Sky says 'maybe'. So do you.", rule: (c) => c.isCloudy, weight: 1 },

  // Defaults
  { text: "It's weather. It's happening.", rule: () => true, weight: 1 },
  { text: "Look outside. That's the forecast.", rule: () => true, weight: 1 },
];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function pickQuote(ctx: QuoteCtx, seedKey: string): string {
  const matches = QUOTES.filter((q) => q.rule(ctx));
  const pool = matches.length ? matches : QUOTES.filter((q) => q.rule({ ...ctx }));
  const totalWeight = pool.reduce((s, q) => s + (q.weight ?? 1), 0);
  const seed = hashSeed(seedKey);
  let n = seed % totalWeight;
  let chosen = pool[0];
  for (const q of pool) {
    const w = q.weight ?? 1;
    if (n < w) {
      chosen = q;
      break;
    }
    n -= w;
  }
  return chosen.text
    .replace("{temp}", Math.round(ctx.tempC).toString())
    .replace("{feels}", Math.round(ctx.feelsLikeC).toString())
    .replace("{wind}", Math.round(ctx.windKmh).toString());
}

export function buildCtx(args: {
  tempC: number;
  feelsLikeC: number;
  weatherId: number;
  main: string;
  windKmh: number;
  hour: number;
}): QuoteCtx {
  const id = args.weatherId;
  return {
    tempC: args.tempC,
    feelsLikeC: args.feelsLikeC,
    deltaFeel: args.feelsLikeC - args.tempC,
    condition: args.main,
    isRain: (id >= 300 && id < 400) || (id >= 500 && id < 600),
    isSnow: id >= 600 && id < 700,
    isThunder: id >= 200 && id < 300,
    isFog: id >= 700 && id < 800,
    isClear: id === 800,
    isCloudy: id > 800 && id < 900,
    windKmh: args.windKmh,
    hour: args.hour,
  };
}