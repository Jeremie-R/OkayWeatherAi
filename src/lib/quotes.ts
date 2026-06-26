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
      "\"Reality is that which, when you stop believing in it, doesn't go away.\" — Philip K. Dick",
      "\"Things are seldom what they seem. Skim milk masquerades as cream.\" — W.S. Gilbert",
      "\"The trust of the innocent is the liar's most useful tool.\" — Stephen King",
      "\"There are three kinds of lies: lies, damned lies, and statistics.\" — Mark Twain",
      "\"The contrast between what is and what seems to be.\" — Marcus Aurelius",
      "Your sensory receptors are currently experiencing a severe calibration error.",
      "\"What is real? How do you define real?\" — Morpheus, The Matrix",
      "The metric system has temporarily lost control of the narrative.",
      "A complete operational mismatch between your hardware and the local climate data.",
    ],
    rule: (c) => Math.abs(c.deltaFeel) >= 4,
    weight: 3,
  },

  // Hot (Extreme Heat Block Updated)
  {
    texts: [
      "Free sauna today.",
      "\"The desert's not kind to humans, either.\" — Liet Kynes",
      "That moment where you consider buying an AC",
      "Mass extinction event",
      "You have finally reached global warming",
      "Congratulations, you are now a slow-cooker experiment.",
      "Even hell's has not reached this temperature yet.",
      "\"The sun is a tyrant.\" — Wallace Stevens",
      
    ],
    rule: (c) => c.tempC >= 38,
    weight: 3,
  },
  {
    texts: [
      "It's {temp}°. Even the pigeons are taking shade.",
      "Officially {temp}°. Unofficially: soup.",
      "Hot enough to fry an egg on your phone case.",
      "Sweating while completely stationary. Seamless design.",
      "{temp}°: The atmosphere has texture, and it is aggressive.",
      "It's not a fever, it's just hot.",
      "Every surface is now a preheated oven. Welcome to {temp}°.",
      "Hydration is no longer a lifestyle choice; it's a hostage negotiation at {temp}°.",
      "\"It's not the heat, it's the humanity.\" — Oscar Wilde",
      "\"The heat was oppressive, standard for August.\" — Joan Didion",
      "\"Boy, it's hot. It's hot. It's like a Walt Disney movie.\" — Robin Williams",
      "\"I feel like I'm melting.\" — Wicked Witch of the West",
      "\"Hot town, summer in the city.\" — The Lovin' Spoonful",
      "Yes, global warming is highly functional at {temp}°.",
      "Air conditioning is no longer a luxury; it is a baseline human rights issue.",
      "\"It's hot. Damn hot.\" — Adrian Cronauer, Good Morning, Vietnam",
      "Your biological cooling systems have entered a state of catastrophic failure.",
    ],
    rule: (c) => c.tempC >= 33,
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
      "\"I am Groot.\" — Groot",
      "\"The sun itself is weak when he first rises, and gathers strength and courage as the day gets on.\" — Charles Dickens",
      "\"Keep your face always toward the sunshine—and shadows will fall behind you.\" — Walt Whitman",
      "\"The sun, the bright sun, that brings back, not light alone, but new life, and hope.\" — Charles Dickens",
      "\"Fear no more the heat o' the sun.\" — William Shakespeare",
      "Time to touch grass.",
      "\"The sun is a wondrous body. Like a magnificent father.\" — Solaire of Astora",
      "Zero cloud cover. The upper atmosphere has absolutely nothing to hide.",
      "\"Look at the sun. It's beautiful.\" — Mace, Sunshine",
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
      "\"Winter is coming.\" — Ned Stark",
      "\"Now is the winter of our discontent.\" — William Shakespeare",
      "\"Cold! If the Good Lord had wanted us to be cold, he would have made us furrier.\" — Lorelai Gilmore",
      "\"I love the cold weather. It means you get to wear your favorite coats.\" — Marilyn Monroe",
      "\"The cold never bothered me anyway.\" — Elsa",
      "It is cold. Just purely, aggressively cold. Plan your movements accordingly.",
      "\"I'm freezing my royal testicles off.\" — Prince Edward, Enchanted",
      "All normal biological functions have decelerated to preserve core architecture.",
      "\"The cold is a separate entity.\" — Arthur Conan Doyle",
    ],
    rule: (c) => c.tempC < 5,
    weight: 3,
  },

  // Extreme cold (Extreme Cold Block Updated)
  {
    texts: [
      "I feel sorry for you",
      "Technically, you chose to live here",
      "Frostbites season started.",
      
      "Where is global warming when we need it. - Donald Trump",
      
      "The day after tomorrow...",
      "Careful, it's a minus in front of the number.",
      
    ],
    rule: (c) => c.tempC < -12,
    weight: 3,
  },

  // Extreme cold / Low feels-like
  {
    texts: [
      "{feels}°? That's not weather, that's a personal attack.",
      "{feels}°: Your face is now entirely ornamental.",
      "The air feels like sharp metal. Enjoy your brief walk.",
      "At {feels}°, inhalation is an active negotiation.",
      "{feels}°. The wind is now a dental procedure.",
      "Every exposed inch of skin is filing a formal grievance at {feels}°.",
      "\"Cold, very cold, like a profile in a silver coin.\" — Vladimir Nabokov",
      "\"It was a bright cold day in April, and the clocks were striking thirteen.\" — George Orwell",
      "\"The air bites shrewdly; it is very cold.\" — William Shakespeare",
      "\"It is as cold as charity.\" — Charles Dickens",
      "\"The cold is absolute.\" — Jack London",
      // New Additions
      "Absolute thermal bankruptcy achieved at {feels}°.",
      "\"Our teeth chattered so loud we couldn't hear ourselves think.\" — Ernest Shackleton",
      "\"If you're cold, you're not moving fast enough.\" — Soviet Proverb",
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
      "\"AARRWWWRRAGGGGAAWWWWWW\" — Chewbacca",
      "\"The wind was like a whetted knife.\" — John Masefield",
      "\"There is a winter wind, and it blows cold.\" — T.S. Eliot",
      "\"Blow, blow, thou winter wind.\" — William Shakespeare",
      "\"The wind is blowing cold from the north.\" — J.R.R. Tolkien",
      // New Additions
      "\"The wind is a wild beast.\" — Victor Hugo",
      "Pure environmental hostility. Wear everything you own simultaneously.",
      "\"Eva?\" — WALL-E",
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
      "High probability of wet socks.",
      "Grey skies, damp denim, minor existential dread.",
      "The sky is leaking.",
      "Every puddle is a surprise personality test.",
      "\"Some people feel the rain. Others just get wet.\" — Bob Marley",
      "\"I'm singing in the rain, just singing in the rain.\" — Gene Kelly",
      "\"The rain falls on the just and the unjust alike.\" — Matthew 5:45",
      "\"Into each life some rain must fall.\" — Henry Wadsworth Longfellow",
      "\"I always like walking in the rain, so no one can see me crying.\" — Charlie Chaplin",
      // New Additions
      "Water is falling from the sky. Again. Truly groundbreaking work from the local ecosystem.",
      "\"It can't rain all the time.\" — Eric Draven, The Crow",
      "Your footwear configuration has been downgraded to an aquarium.",
      "\"I'm only happy when it rains.\" — Garbage",
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
      
      "Charming on Instagram, unwanted icerink videos queuing up.",
      
      
      "\"The snow is sparkling like a million little diamonds.\" — L.M. Montgomery",
      "\"Do you wanna build a snowman?\" — Anna",
      "\"I know a little text about snow.\" — Karl Lagerfeld",
      "\"Snow is fine when you're inside.\" — Orhan Pamuk",
      "\"A snow day is a beautiful thing.\" — Rachel Cohn",
      
      "Yes, it is actually snowing.",
      "\"The snow is a white shroud.\" — Mary Shelley",
      "Municipal logistics are entirely dead.",
      
    ],
    rule: (c) => c.isSnow,
    weight: 3,
  },

  // Thunder
  {
    texts: [
      "Thunder. The sky is in a mood.",
      "Storm incoming. Unplug something dramatic.",
      "Atmospheric drama.",
      "New Sound effects unlocked.",
      "A free light show with immediate sonic consequences.",
      
      "Best not to get involved.",
      
      "\"The thunder child is fighting.\" — H.G. Wells",
      "\"The sky was a bruised purple and the thunder rolled.\" — Stephen King",
      "\"Thunder, feel the thunder.\" — Imagine Dragons",
      "\"I am Thor, Son of Odin!\" — Thor",
      
      "\"The sky tore open.\" — Haruki Murakami",
      "Lights from the sky, meh, what else is new.",
      "\"I am the storm.\" — Ethan Hunt",
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
      "The mist is hungry",
      
      "\"It was a foggy night, a night when things happen.\" — Raymond Chandler",
      "\"Fog everywhere. Fog up the river, fog down the river.\" — Charles Dickens",
      "\"Visions of the fog.\" — Bob Dylan",
      "\"Mist and fog, and a cold wind.\" — J.R.R. Tolkien",
      "Studies suggest you had miopia annyway.",
      "\"There's something in the mist!\" — David Drayton, The Mist",
      "You wouldn't see the alien even if it was in front of you.",
      "\"A dense damp mist lay over the land.\" — J.R.R. Tolkien",
    ],
    rule: (c) => c.isFog,
    weight: 3,
  },

  // Windy (>= 40 km/h)
  {
    texts: [
      "Wind at {wind} km/h. Hold onto your hat. And your dog.",
      "Nature's leaf blower.",
      
      "The atmosphere is moving faster than your career path.",
      "{wind} km/h. Walking is now a sport.",
      "Trash cans are auditioning for flight school at {wind} km/h.",
      "\"The answer, my friend, is blowin' in the wind.\" — Bob Dylan",
      "\"The wind howled like a banished soul.\" — Bram Stoker",
      "\"It's a bit windy, isn't it?\" — Winnie the Pooh",
      "\"Gone with the wind.\" — Margaret Mitchell",
      "\"The wind shook the house.\" — Virginia Woolf",
      "\"The wind is blowing a gale.\" — Virginia Woolf",
      "A highly aggressive propulsion experiment.",
      
    ],
    rule: (c) => c.windKmh >= 40,
    weight: 3,
  },

  // Windy (30-50 km/h)
  {
    texts: [
      "Windy. Hair will not survive this commute.",
      "Slightly too aggressive air. Unsolicited resistance.",
      "{wind} km/h: Solid day for wind turbines, terrible for human.",
      "The wind is trying to make a point.",
      
      "{wind} km/h. Every doorway is a wind tunnel exam.",
      "\"*Beep boop whistle chirp*\" — R2-D2",
      "\"The wind will whisper your name.\" — Jimi Hendrix",
      "\"The wind is rising! We must try to live!\" — Paul Valéry",
      "\"A wind has blown the rain away.\" — E.E. Cummings",
      "\"The wind plays its own tune.\" — Haruki Murakami",
      "Just enough environmental resistance to make you look slightly frantic.",
      "The air is expressing a highly specific personal grievance at {wind} km/h.",
      "\"The air is restless.\" — Bram Stoker",
      "Proceed with standard caution.",
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
      "\"The time is beautiful today.\" — Nicolas Sarkozy to Queen Elizabeth",
      "\"It's a beautiful day in this neighborhood.\" — Mister Rogers",
      "\"Oh, what a lovely day!\" — Nux",
      "\"A perfect summer day is when the sun is shining.\" — Sam Adams",
      "\"It's a beautiful day, don't let it get away.\" — U2",
      "Yes, it's actually sunny today.",
      "Time to touch grass.",
      "\"What a day. What a beautiful day!\" — Max Rockatansky, Mad Max: Fury Road",
    ],
    rule: (c) => c.isClear && c.tempC >= 18 && c.tempC <= 26,
    weight: 3,
  },

  // Cloudy mild
  {
    texts: [
      "Grey, mild, forgettable. The default.",
      "Sky says 'maybe'. So do you.",
      
      "Neither warm nor cold.",
      "Visual white noise.",
      "Cloudy and indecisive. Classic avoidant attachment sky.",
      "soft, slow, and vague.",
      "\"Hodor.\" — Hodor",
      "\"The sky was the color of television, tuned to a dead channel.\" — William Gibson",
      "\"Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.\" — Rabindranath Tagore",
      "\"A cloudy day is no match for a sunny disposition.\" — William Arthur Ward",
      "\"The sky is low, the clouds are mean.\" — Emily Dickinson",
      "\"The sky is a uniform, heavy grey.\" — Charlotte Brontë",
      "Neither inspiring nor offensive.",
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
      
      "Indifferent.",
      "\"Weather forecast for tonight: dark.\" — George Carlin",
      "\"There is no such thing as bad weather, only different kinds of good weather.\" — John Ruskin",
      "\"Climate is what we expect, weather is what we get.\" — Mark Twain",
      "\"Everybody talks about the weather, but nobody does anything about it.\" — Charles Dudley Warner",
      "\"Whether the weather be fine, or whether the weather be not.\" — Traditional Nursery Rhyme",
      "Status check: The sky is up. The ground remains down.",
      "\"Tomorrow is another day.\" — Scarlett O'Hara, Gone with the Wind",
      "\"It's just the weather.\" — Casual observation",
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
