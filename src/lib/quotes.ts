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
      "In the end, it's just a number, and you know it's not real.",
      "Thermometer is lying. It actually feels like {feels}°.",
      "A textbook case of meteorological gaslighting. It feels like {feels}°.",
      "\"Reality is that which, when you stop believing in it, doesn't go away.\" — Philip K. Dick",
      "Do not trust the main temperature.",
      "\"The contrast between what is and what seems to be.\" — Marcus Aurelius",
      "\"What is real? How do you define real?\" — Morpheus",
    ],
    rule: (c) => Math.abs(c.deltaFeel) >= 4,
    weight: 3,
  },

  // Extreme heat
  {
    texts: [
      "Free sauna today.",
      "\"The desert's not kind to humans, either.\" — Dune",
      "That moment where you consider buying an AC",
      "Mass extinction event",
      "Welcome to global warming",
      "Optimal rotisserie temperature.",
      "Are you grilling the meat, or is the BBQ grilling you?",
      "That is what oyu get for wishing summer all year long.",
    ],
    rule: (c) => c.tempC >= 37,
    weight: 3,
  },

  // Hot
  {
    texts: [
      "Even the pigeons are taking shade.",
      "Sweating like a donkey.",
      "It's not a fever, it's just hot.",
      "Air conditioning is no longer a luxury; it is a baseline human rights issue.",
      "Your biological cooling systems have entered a state of catastrophic failure.",
      "Tropical heat...",
      "Time for icecream.",
    ],
    rule: (c) => c.tempC >= 30,
    weight: 3,
  },

  // Hot + clear
  {
    texts: [
      "Sunscreen called. It wants reinforcements.",
      "The sky is a giant ball of fire.",
      "UV is currently an active threat.",
      "Shadows are the only real estate that matters right now.",
      "\"I am Groot.\" — Groot",
      "\"Fear no more the heat of the sun.\" — Shakespeare",
      "Time to touch grass.",
      "\"The time is beautiful today\" — Sarkosy to Q.E.",
      "Perfect day for your office job.",
    ],
    rule: (c) => c.tempC >= 28 && c.isClear,
    weight: 2,
  },

  // Cold
  {
    texts: [
      "Not sure if you should go out ? Don't.",
      "Layer like an onion, complain like a Parisian.",
      "Your toes have officially given up and accepted their fate. Say goodbye to them.",
      "Gloves or regret.",
      "Winter is coming.",
      "\"Now is the winter of our discontent.\" — Shakespeare",
      "It is cold. what else do you wanna know ?",
      "Hibernation would be nice, but you have to go to work.",
      "Some say being cold is good for you...",
    ],
    rule: (c) => c.tempC < 5,
    weight: 3,
  },

  // Extreme cold
  {
    texts: [
      "I feel sorry for you",
      "Technically, you chose to live here",
      "Free ice skating rink outside.",
      "\"Where is global warming when we need it?\" — Donald Trump",
      "The day after tomorrow...",
      "Careful, it's a minus in front of the number.",
    ],
    rule: (c) => c.tempC < -10,
    weight: 3,
  },

  // Low feels-like
  {
    texts: [
      "The air feels like sharp metal. Enjoy your brief walk.",
      "Thank for covering your face up, you where not good looking anyway.",
      "The cold is absolute.",
      "You do'nt wanna know how it feels like.",
      "You already knew it was not a good idea.",
      "\"If you're cold, you're not moving fast enough.\" — Soviet Proverb",
    ],
    rule: (c) => c.feelsLikeC <= -5,
    weight: 2,
  },

  // Chilly + windy
  {
    texts: [
      "For sure if there where no wind it would be fine.",
      "Stand outside for two minutes... If you can.",
      "\"AARRWWWRRAGGGGAAWWWWWW\" — Chewbacca",
    ],
    rule: (c) => c.tempC <= 8 && c.windKmh >= 25,
    weight: 3,
  },

  // Rain
  {
    texts: [
      "Rain. Because of course.",
      "It's raining. In case you didn't know",
      "Bring an umbrella. Lose an umbrella... Traditions",
      "High probability of wet socks.",
      "\"Some people feel the rain. Others just get wet.\" — Bob Marley",
      "It can't rain all the time? ... right ?",
      "Your 'waterproof' jacket was a lie.",
      "Are you water resistant? ... yeah I didn't think so.",
      "Weather to read a book, too bad you don't read.",
      "You can always choose to eat and get fat.",
    ],
    rule: (c) => c.isRain,
    weight: 2,
  },

  // Snow
  {
    texts: [
      "Snow! It's pretty for the first 12 minutes.",
      "Tokyo drift on the street",
      "All train services have now stopped, I hope you didn't needed to get home",
      "Snow is fine when you're inside.",
      "\"A snow day is a beautiful thing.\" — Rachel Cohn",
      "Yes, it is actually snowing.",
      "Frozen white bullshit is covering the ground.",
      "Let the hypothermia set in quietly.",
    ],
    rule: (c) => c.isSnow,
    weight: 3,
  },

  // Thunder
  {
    texts: [
      "I feel sorry for dogs",
      "Unplug something dramatic.",
      "New Sound effects unlocked.",
      "A free light show...",
      "Best not to get involved.",
      "\"I am Thor, Son of Odin!\" — Thor",
      "Lights from the sky, meh, what else is new.",
      "\"I am the storm.\" — Ethan Hunt",
    ],
    rule: (c) => c.isThunder,
    weight: 3,
  },

  // Fog
  {
    texts: [
      "Visibility: vibes only.",
      "You can't see, too bad...",
      "we often forget, fog will also make you wet.",
      "It's not technically raining, you are just in the cloud",
      "The mist is hungry",
      "Okay, today you can stay home.",
      "Studies suggest you had miopia annyway.",
      "Soup like air",
      "You wouldn't see the alien even if it was in front of you.",
    ],
    rule: (c) => c.isFog,
    weight: 3,
  },

  // Wind strong (>= 40 km/h)
  {
    texts: [
      "Leaf blower.",
      "The atmosphere is moving faster than your career path.",
      "Walking is now a sport.",
      "Too bad you have to bike today.",
      "\"It's a bit windy, isn't it?\" — Winnie",
      "Free blow",
    ],
    rule: (c) => c.windKmh >= 40,
    weight: 3,
  },

  // Perfect day (slightly complaining)
  {
    texts: [
      "Too bad you are staying in today.",
      "Perfect day to be sick",
      "I'm sure somehting else will come for you.",
      "Enjoy Enjoy, While you can.",
      "Today, everyone will go craxy abotu going out.",
      "Excellent conditions for feeling guilty about sitting at a desk.",
      "\"It's a beautiful day\" — U2",
      "Yes, it's actually sunny today.",
      "Time to touch grass.",
    ],
    rule: (c) => c.isClear && c.tempC >= 18 && c.tempC <= 26,
    weight: 3,
  },

  // Cloudy
  {
    texts: [
      "Forgettable weather",
      "Why do you read this ?",
      "\"Hodor.\" — Hodor",
      "Maybe do somehting with yourself today",
      "Horoscope says: better to jsut deal with it",
      "Whether the Weather",
    ],
    rule: (c) => c.isCloudy,
    weight: 1,
  },

  // Defaults
  {
    texts: [
      "It's happening.",
      "Look outside. That's the weather.",
      "Just do something today.",
      "The sky is up. Your are down...",
      "One day, it will be exctiting...",
      "It's just the weather.",
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
