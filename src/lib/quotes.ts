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
      "The app claims {temp}°, reality insists on {feels}°. Trust the friction.",
      "Math says {temp}°, nerve endings say {feels}°. The gap is pure malice.",
      "A textbook case of meteorological gaslighting. It feels like {feels}°.",
      "Your weather app graduated from denial school. {temp}° is not {feels}°.",
      "Dress for {feels}°, not for {temp}°. The numbers are having an argument.",
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
      "Sweating while completely stationary. Seamless design.",
      "{temp}°: The atmosphere has texture, and it is aggressive.",
      "Your structural integrity is melting at {temp}°.",
      "Every surface is now a preheated oven. Welcome to {temp}°.",
      "Hydration is no longer a lifestyle choice; it's a hostage negotiation at {temp}°.",
    ],
    rule: (c) => c.tempC >= 30,
    weight: 3,
  },
  {
    texts: [
      "Sunscreen called. It wants reinforcements.",
      "The sky is a giant laser and you are an ant. Wear a hat.",
      "{temp}° and unshaded. Main character energy with a tragic ending.",
      "UV index is currently an active threat.",
      "Shadows are the only real estate that matters right now.",
      "{temp}° and cloudless. The sun is showing off its full resume.",
    ],
    rule: (c) => c.tempC >= 28 && c.isClear,
    weight: 2,
  },

  // Cold
  {
    texts: [
      "{temp}°. Your nose is officially a popsicle.",
      "It's {temp}°. Layer like an onion, complain like a Parisian.",
      "Cold enough to make your coffee feel personal.",
      "An absolute lack of thermal hospitality outside.",
      "{temp}°. Time to look at real estate options near the equator.",
      "Thermal underwear isn't a choice anymore; it's a structural requirement.",
      "{temp}° and every breath is a tiny visible resignation letter.",
      "Your fingers are now decorative at {temp}°. Gloves or regret.",
    ],
    rule: (c) => c.tempC < 5,
    weight: 3,
  },
  {
    texts: [
      "{feels}°? That's not weather, that's a personal attack.",
      "{feels}°: Your face is now entirely ornamental.",
      "The air feels like sharp metal. Enjoy your brief walk.",
      "At {feels}°, inhalation is an active negotiation.",
      "{feels}°. The wind is now a dental procedure.",
      "Every exposed inch of skin is filing a formal grievance at {feels}°.",
    ],
    rule: (c) => c.feelsLikeC <= -5,
    weight: 3,
  },

  // Chilly + windy
  {
    texts: [
      "{temp}° with {wind} km/h of wind. That's the cold doing cardio.",
      "Wind chill says hi. {feels}° and rude about it.",
      "Bundle up — the wind is editorializing.",
      "{temp}° with a side of aerodynamic disrespect.",
      "Horizontal freezing. The worst kind of alignment.",
      "The wind is actively seeking out the single unzipped centimeter of your jacket.",
      "{temp}° and windy. It's like being licked by a frozen escalator.",
      "Your jacket is only a suggestion at {wind} km/h and {feels}°.",
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
      "Gravity is delivering gray water directly to your face.",
      "Suboptimal humidity levels. High probability of wet socks.",
      "Grey skies, damp denim, minor existential dread.",
      "The sky is leaking and nobody is answering the maintenance ticket.",
      "Every puddle is a surprise personality test.",
    ],
    rule: (c) => c.isRain,
    weight: 2,
  },

  // Snow
  {
    texts: [
      "Snow! It's pretty for the first 12 minutes.",
      "Snow day. Drive like everyone forgot how cars work.",
      "Aesthetically pleasing, logistically disastrous.",
      "Slush in production. Prepare your footwear.",
      "Charming on Instagram, highly abrasive on the sidewalk.",
      "Snow: a billion tiny hydration ambushes.",
      "The world is now a soft-serve machine. Tread carefully.",
    ],
    rule: (c) => c.isSnow,
    weight: 3,
  },

  // Thunder
  {
    texts: [
      "Thunder. The sky is in a mood.",
      "Storm incoming. Unplug something dramatic.",
      "Atmospheric drama. Nature is typing in all caps.",
      "Sound effects provided by the upper atmosphere.",
      "A free light show with immediate sonic consequences.",
      "The sky is rehearsing a drum solo. No refunds.",
      "Clouds are arguing loudly. Best not to get involved.",
    ],
    rule: (c) => c.isThunder,
    weight: 3,
  },

  // Fog
  {
    texts: [
      "Fog. Visibility: vibes only.",
      "The world hasn't rendered properly yet. Please wait.",
      "Silent Hill mode activated. Watch your step.",
      "Like walking through a poorly conceptualized cloud.",
      "Fog: the sky's way of turning down the draw distance.",
      "Every lamppost is now a main character.",
    ],
    rule: (c) => c.isFog,
    weight: 3,
  },

  // Windy
  {
    texts: [
      "Wind at {wind} km/h. Hold onto your hat. And your dog.",
      "Nature's leaf blower is set to maximum.",
      "{wind} km/h. Fighting the air just to move forward.",
      "The atmosphere is moving faster than your career path.",
      "{wind} km/h. Walking is now a sport.",
      "Trash cans are auditioning for flight school at {wind} km/h.",
    ],
    rule: (c) => c.windKmh >= 40,
    weight: 3,
  },
  {
    texts: [
      "Windy. Hair will not survive this commute.",
      "Slightly too aggressive air. Unsolicited resistance.",
      "{wind} km/h: Solid day for wind turbines, terrible for human dignity.",
      "The wind is trying to make a point. Loudly.",
      "Gusty enough to turn your shopping list into public art.",
      "{wind} km/h. Every doorway is a wind tunnel exam.",
    ],
    rule: (c) => c.windKmh >= 30 && c.windKmh < 50,
    weight: 2,
  },

  // Perfect day (slightly complaining)
  {
    texts: [
      "Annoyingly perfect. {temp}° and not a cloud to blame.",
      "Suspiciously nice out. What does it want?",
      "{temp}° and sunny. Show-off weather.",
      "{temp}° and clear. Now you have no excuse to be miserable indoors.",
      "Uncomfortably optimal. Expect a catch later in the week.",
      "Excellent conditions for feeling guilty about sitting at a desk.",
      "{temp}° and flawless. The weather is humble-bragging.",
      "Perfect enough to make you suspicious of the calendar.",
    ],
    rule: (c) => c.isClear && c.tempC >= 18 && c.tempC <= 26,
    weight: 3,
  },

  // Cloudy mild
  {
    texts: [
      "Grey, mild, forgettable. The default.",
      "Sky says 'maybe'. So do you.",
      "An uninspired canvas. Total design apathy from the sky.",
      "Neither warm nor cold. The lukewarm tap water of weather.",
      "Visual white noise. Move along.",
      "Cloudy and indecisive. Classic avoidant attachment sky.",
      "The sky is buffering. Today will be soft, slow, and vague.",
    ],
    rule: (c) => c.isCloudy,
    weight: 1,
  },

  // Defaults
  {
    texts: [
      "It's weather. It's happening.",
      "Look outside. That's the forecast.",
      "Standard operational parameters. Nothing to report.",
      "The background simulation continues.",
      "Status: Weather exists.",
      "A day. With weather. What a concept.",
      "No strong feelings. The weather is also indifferent.",
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
