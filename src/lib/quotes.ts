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

interface QuoteRule {
  texts: string[];
  rule: (c: QuoteCtx) => boolean;
  weight?: number;
}

const QUOTES: QuoteRule[] = [
  // Big feels-like gap (priority)
  {
    texts: [
      "Says {temp}° but your skin filed a complaint at {feels}°.",
      "On paper: {temp}°. In real life: {feels}°. Trust the body.",
      "Thermometer is lying. It actually feels like {feels}°.",
    ],
    rule: (c) => Math.abs(c.deltaFeel) >= 4,
    weight: 3,
  },

  // Hot
  {
    texts: [
      "It's {temp}°. Even the pigeons are taking shade.",
      "Officially {temp}°. Unofficially: soup.",
      "Hot enough to fry an egg on your phone case.",
    ],
    rule: (c) => c.tempC >= 30,
    weight: 3,
  },
  {
    texts: ["Sunscreen called. It wants reinforcements."],
    rule: (c) => c.tempC >= 28 && c.isClear,
    weight: 2,
  },

  // Cold
  {
    texts: [
      "{temp}°. Your nose is officially a popsicle.",
      "It's {temp}°. Layer like an onion, complain like a Parisian.",
      "Cold enough to make your coffee feel personal.",
    ],
    rule: (c) => c.tempC < 5,
    weight: 3,
  },
  {
    texts: ["{feels}°? That's not weather, that's a personal attack."],
    rule: (c) => c.feelsLikeC <= -5,
    weight: 3,
  },

  // Chilly + windy (new bucket)
  {
    texts: [
      "{temp}° with {wind} km/h of wind. That's the cold doing cardio.",
      "Wind chill says hi. {feels}° and rude about it.",
      "Bundle up — the wind is editorializing.",
    ],
    rule: (c) => c.tempC <= 8 && c.windKmh >= 25,
    weight: 3,
  },

  // Rain
  {
    texts: [
      "Rain. Because of course.",
      "It's raining. Hair plans cancelled.",
      "Bring an umbrella. Lose an umbrella. Tradition.",
      "Liquid sunshine, if you're an optimist.",
    ],
    rule: (c) => c.isRain,
    weight: 2,
  },

  // Snow
  {
    texts: [
      "Snow! It's pretty for the first 12 minutes.",
      "Snow day. Drive like everyone forgot how cars work.",
    ],
    rule: (c) => c.isSnow,
    weight: 3,
  },

  // Thunder
  {
    texts: [
      "Thunder. The sky is in a mood.",
      "Storm incoming. Unplug something dramatic.",
    ],
    rule: (c) => c.isThunder,
    weight: 3,
  },

  // Fog
  {
    texts: ["Fog. Visibility: vibes only."],
    rule: (c) => c.isFog,
    weight: 3,
  },

  // Windy
  {
    texts: ["Wind at {wind} km/h. Hold onto your hat. And your dog."],
    rule: (c) => c.windKmh >= 40,
    weight: 3,
  },
  {
    texts: ["Windy. Hair will not survive this commute."],
    rule: (c) => c.windKmh >= 30 && c.windKmh < 50,
    weight: 2,
  },

  // Perfect day (slightly complaining)
  {
    texts: [
      "Annoyingly perfect. {temp}° and not a cloud to blame.",
      "Suspiciously nice out. What does it want?",
      "{temp}° and sunny. Show-off weather.",
    ],
    rule: (c) => c.isClear && c.tempC >= 18 && c.tempC <= 26,
    weight: 3,
  },

  // Cloudy mild
  {
    texts: [
      "Grey, mild, forgettable. The default.",
      "Sky says 'maybe'. So do you.",
    ],
    rule: (c) => c.isCloudy,
    weight: 1,
  },

  // Defaults
  {
    texts: [
      "It's weather. It's happening.",
      "Look outside. That's the forecast.",
    ],
    rule: () => true,
    weight: 1,
  },
];

export function pickQuote(ctx: QuoteCtx): string {
  const matches = QUOTES.filter((q) => q.rule(ctx));
  const pool = matches.length ? matches : QUOTES.filter((q) => q.rule === (() => true) || true);
  const totalWeight = pool.reduce((s, q) => s + (q.weight ?? 1), 0);
  let n = Math.random() * totalWeight;
  let chosen = pool[0];
  for (const q of pool) {
    const w = q.weight ?? 1;
    if (n < w) {
      chosen = q;
      break;
    }
    n -= w;
  }
  const text = chosen.texts[Math.floor(Math.random() * chosen.texts.length)];
  return text
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