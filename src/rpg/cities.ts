/**
 * Home city (career start): where the studio is shapes four things at the margin.
 *
 *  - Currency: display only. The economy stays in studio dollars so balance, saves and the
 *    settlement maths are untouched; money is converted for reading (`formatMoney`).
 *  - Regional taste: a bounded popularity delta per genre (feeds the market multiplier) and a
 *    mild boost to how often enquiries in a hot local genre turn up.
 *  - People: staff candidates and session musicians draw part of their names from local pools.
 *  - Local events: a few city-flavoured Studio Event Director rows (see `cityEvents.ts`).
 *
 * A save with no `cityId` is neutral: no delta, no boost, dollars, era names. Pure and deterministic.
 */
import type { GameState } from '@/types/game';
import { formatNumber } from '@/i18n/formatLocale';
import { tc } from '@/i18n/content';

export type CityId = 'los-angeles' | 'nashville' | 'london' | 'berlin' | 'tokyo' | 'rio';

export const DEFAULT_CITY_ID: CityId = 'los-angeles';

export interface CityCurrency {
  code: string;
  symbol: string;
  /** Local units per studio dollar. Display only. */
  perDollar: number;
}

export type CityEraId = 'analog60s' | 'digital80s' | 'internet2000s' | 'streaming2020s';
export const CITY_ERAS: readonly CityEraId[] = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'];

/** What a city adds to the producer: one starting attribute point and a line of why. */
export interface CityEdge {
  attribute: 'focusMastery' | 'creativeIntuition' | 'technicalAptitude' | 'businessAcumen';
  label: string;
  why: string;
}

export interface CityLore {
  blurb: string;
  landmarks: readonly string[];
  legend: string;
  /** What the local scene is like in each era. */
  eras: Record<CityEraId, string>;
}

export interface City {
  id: CityId;
  name: string;
  country: string;
  tagline: string;
  currency: CityCurrency;
  /** Genres the city is known for: +HOT popularity, more enquiries. */
  hotGenres: readonly string[];
  /** Genres that sell less here: -COOL popularity. */
  coolGenres: readonly string[];
  names: { first: readonly string[]; last: readonly string[] };
  scene: string;
  /** Interface accent for the city (hex) and a skyline silhouette key. */
  accent: string;
  edge: CityEdge;
  lore: CityLore;
  /** Era currency overrides: symbol/code/rate by era. Missing eras use `currency`. */
  eraCurrency?: Partial<Record<CityEraId, CityCurrency>>;
}

export const HOT_POPULARITY = 8;
export const COOL_POPULARITY = -6;
export const HOT_ENQUIRY_WEIGHT = 1.5;

export const CITIES: readonly City[] = [
  {
    id: 'los-angeles', name: 'Los Angeles', country: 'USA', tagline: 'Sunset sessions, label money and a studio on every corner.',
    currency: { code: 'USD', symbol: '$', perDollar: 1 },
    hotGenres: ['Pop', 'Hip-Hop', 'Soul', 'Trap'], coolGenres: ['Folk', 'Punk'],
    names: {
      first: ['Jordan', 'Mason', 'Kiara', 'Devin', 'Tatum', 'Marisol', 'Dre', 'Skylar', 'Ximena', 'Rudy'],
      last: ['Alvarez', 'Whitaker', 'Nakamura', 'Okafor', 'Delgado', 'Sinclair', 'Park', 'Reyes', 'Holloway', 'Barnes'],
    },
    scene: 'Canyon sessions and label lunches',
    accent: '#f2a65a',
    edge: { attribute: 'businessAcumen', label: 'Deal-maker', why: 'Label lunches teach you how a rate card really works.' },
    lore: {
      blurb: 'The studio capital of the Pacific: every second building has a live room and a story about who cut what there.',
      landmarks: ['The Sunset Strip sound-stage rooms', 'A Hollywood tracking floor with a famous echo chamber', 'A canyon house with a mountain of tape'],
      legend: 'They say a producer in LA is only ever one lunch away from a hit, or a very long wait for the check.',
      eras: { analog60s: 'Session players, tiki bars and big-band engineers hand the town its first sound.', digital80s: 'Gloss, gated drums and a label on every corner.', internet2000s: 'Every bedroom is a studio; the boulevards still pay for the polish.', streaming2020s: 'Streaming money, beat-makers in rented villas and one very good taco truck.' },
    },
  },
  {
    id: 'nashville', name: 'Nashville', country: 'USA', tagline: 'Songwriters on every porch and a round at every bar.',
    currency: { code: 'USD', symbol: '$', perDollar: 1 },
    hotGenres: ['Country', 'Folk', 'Blues', 'Acoustic'], coolGenres: ['EDM', 'Electronic'],
    names: {
      first: ['Waylon', 'Loretta', 'Hank', 'Tammy', 'Cash', 'Dolly', 'Merle', 'Reba', 'Clay', 'Savannah'],
      last: ['Tillman', 'Haggard', 'McBride', 'Crenshaw', 'Parton', 'Rutledge', 'Buckner', 'Calloway', 'Dunn', 'Stapleton'],
    },
    scene: 'Songwriter rounds and Music Row',
    accent: '#d98c4a',
    edge: { attribute: 'creativeIntuition', label: 'Song sense', why: 'Writers\' rounds sharpen your ear for a hook that holds.' },
    lore: {
      blurb: 'Music City: songwriters share stages the way other towns share parking lots, and a three-chord idea is a serious thing.',
      landmarks: ['Music Row\'s converted houses', 'A radio-station-turned-studio with a beloved vocal booth', 'A honky-tonk with a stage-door demo tape box'],
      legend: 'Locals swear the best songs are written between the first coffee and the second verse.',
      eras: { analog60s: 'Country meets rock and roll in tiny rooms with big, warm microphones.', digital80s: 'Polished Nashville pop-country finds its crossover audience.', internet2000s: 'Writers sell songs to every genre; the town learns to wear a different hat.', streaming2020s: 'Indie-folk and streaming playlists put the old rooms back on the map.' },
    },
  },
  {
    id: 'london', name: 'London', country: 'UK', tagline: 'Pirate radio, Soho studios and a taste for whatever is next.',
    currency: { code: 'GBP', symbol: '£', perDollar: 0.8 },
    hotGenres: ['Indie', 'Punk', 'Electronic', 'New Wave'], coolGenres: ['Country', 'Hair Metal'],
    names: {
      first: ['Arthur', 'Poppy', 'Callum', 'Imogen', 'Rhys', 'Zadie', 'Jamal', 'Elsie', 'Harvey', 'Priya'],
      last: ['Pemberton', 'Okonkwo', 'Hartley', 'Banerjee', 'Fairweather', 'Doyle', 'Ashworth', 'Mensah', 'Caldwell', 'Quinn'],
    },
    scene: 'Soho basements and pirate radio',
    accent: '#7fa8d9',
    edge: { attribute: 'focusMastery', label: 'Studio discipline', why: 'Short sessions and tight budgets teach you to hold focus.' },
    lore: {
      blurb: 'Basement studios, pirate aerials and a music press that decides what is cool by Tuesday.',
      landmarks: ['A Soho basement with a ceiling pipe that sings', 'A zebra-crossing-adjacent studio everyone photographs', 'A railway-arch room with train-timed takes'],
      legend: 'Every London engineer has a recording ruined by the Northern line, and a tale that makes up for it.',
      eras: { analog60s: 'The Mod beat boom and the first real British studio sound.', digital80s: 'Synth-pop, post-punk and a hundred bands in one postcode.', internet2000s: 'Britpop, garage and dance floors that never really close.', streaming2020s: 'Grime, bedroom pop and big-label rooms turned into co-working desks.' },
    },
    eraCurrency: { analog60s: { code: 'GBP', symbol: '£', perDollar: 0.36 }, digital80s: { code: 'GBP', symbol: '£', perDollar: 0.6 }, internet2000s: { code: 'GBP', symbol: '£', perDollar: 0.6 }, streaming2020s: { code: 'GBP', symbol: '£', perDollar: 0.8 } },
  },
  {
    id: 'berlin', name: 'Berlin', country: 'Germany', tagline: 'Club culture, cheap rent and rooms that never close.',
    currency: { code: 'EUR', symbol: '€', perDollar: 0.92 },
    hotGenres: ['Electronic', 'EDM', 'Digital', 'Lo-fi'], coolGenres: ['Country', 'Motown'],
    names: {
      first: ['Lukas', 'Mira', 'Jonas', 'Elif', 'Tobias', 'Nina', 'Ruben', 'Greta', 'Felix', 'Amara'],
      last: ['Vogel', 'Kaya', 'Brandt', 'Neumann', 'Richter', 'Yilmaz', 'Hartmann', 'Lindqvist', 'Becker', 'Sommer'],
    },
    scene: 'Warehouse nights and Kreuzberg studios',
    accent: '#9aa3b8',
    edge: { attribute: 'technicalAptitude', label: 'Signal nerd', why: 'Warehouse rigs and modular racks make you fluent in signal flow.' },
    lore: {
      blurb: 'Concrete, club culture and the cheap rent that lets weird ideas run all night.',
      landmarks: ['A wartime-bunker-turned-studio with thick walls', 'A hall by the Wall with a famous drum room', 'A Kreuzberg backroom with a modular wall'],
      legend: 'They say Berlin doesn\'t close; it just changes tempo around six a.m.',
      eras: { analog60s: 'A divided city, a cold-war sound and a few studios by the border.', digital80s: 'Krautrock\'s children meet synth pop in a half-empty city.', internet2000s: 'Reunified rooms, techno clubs and rent so low the experiments never stop.', streaming2020s: 'A global capital of electronic music, with a waiting list for the good rooms.' },
    },
    eraCurrency: { analog60s: { code: 'DEM', symbol: 'DM', perDollar: 4.0 }, digital80s: { code: 'DEM', symbol: 'DM', perDollar: 2.0 }, internet2000s: { code: 'EUR', symbol: '€', perDollar: 1.1 }, streaming2020s: { code: 'EUR', symbol: '€', perDollar: 0.92 } },
  },
  {
    id: 'tokyo', name: 'Tokyo', country: 'Japan', tagline: 'Immaculate rooms, vinyl bars and pop built like precision gear.',
    currency: { code: 'JPY', symbol: '¥', perDollar: 150 },
    hotGenres: ['Pop', 'Indie Pop', 'Lo-fi', 'TikTok Pop'], coolGenres: ['Blues', 'Country'],
    names: {
      first: ['Haruto', 'Yui', 'Ren', 'Sakura', 'Kaito', 'Mio', 'Daichi', 'Aoi', 'Takumi', 'Hinata'],
      last: ['Tanaka', 'Fujimoto', 'Kobayashi', 'Matsuda', 'Okada', 'Shimizu', 'Arai', 'Hayashi', 'Mori', 'Ishikawa'],
    },
    scene: 'Shibuya live houses and vinyl bars',
    accent: '#e87aa0',
    edge: { attribute: 'technicalAptitude', label: 'Precision ear', why: 'A culture of immaculate craft rewards every careful detail.' },
    lore: {
      blurb: 'Immaculate rooms, vinyl bars the size of a closet and pop engineered like fine hardware.',
      landmarks: ['A Shibuya live house with a perfect small room', 'A vinyl listening bar under a railway arch', 'A Roppongi tower studio with a city-wide view'],
      legend: 'A veteran engineer here can tell a patch cable was bought secondhand just by the way it sounds.',
      eras: { analog60s: 'Jazz kissas and mellow ballads; the first big studios open their doors.', digital80s: 'City pop, synthesizers and the world\'s best-built hardware.', internet2000s: 'Idol factories, J-pop hits and rooms packed with gear.', streaming2020s: 'Streaming brings city pop back; the vinyl bars are full again.' },
    },
    eraCurrency: { analog60s: { code: 'JPY', symbol: '¥', perDollar: 360 }, digital80s: { code: 'JPY', symbol: '¥', perDollar: 220 }, internet2000s: { code: 'JPY', symbol: '¥', perDollar: 115 }, streaming2020s: { code: 'JPY', symbol: '¥', perDollar: 145 } },
  },
  {
    id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', tagline: 'Samba schools, funk parties and music that lives outdoors.',
    currency: { code: 'BRL', symbol: 'R$', perDollar: 5 },
    hotGenres: ['Disco', 'Hip-Hop', 'Soul', 'Jazz'], coolGenres: ['Hair Metal', 'Emo'],
    names: {
      first: ['Thiago', 'Beatriz', 'Caetano', 'Luana', 'Gilberto', 'Marina', 'Rafael', 'Iara', 'Joao', 'Camila'],
      last: ['Silva', 'Nascimento', 'Moreira', 'Barros', 'Carvalho', 'Duarte', 'Teixeira', 'Pacheco', 'Lacerda', 'Veloso'],
    },
    scene: 'Lapa rodas and carnival rehearsals',
    accent: '#5fbf7a',
    edge: { attribute: 'creativeIntuition', label: 'Groove sense', why: 'Samba schools teach you where the one really is.' },
    lore: {
      blurb: 'Samba schools, funk parties and music that lives outdoors, and a room that fits ninety drummers is called intimate.',
      landmarks: ['A Lapa roda de samba room with a famous hum', 'A hillside favela studio with a rooftop live room', 'A Copacabana bossa-nova apartment with a legendary piano'],
      legend: 'Local engineers say the secret of any Rio record is simple: leave the door open and let the street in.',
      eras: { analog60s: 'Bossa nova turns apartments into studios and exports a whole mood.', digital80s: 'Tropicalia\'s children meet synthesizers and a very loud pop scene.', internet2000s: 'Baile funk and electronic crossovers pour out of the hills.', streaming2020s: 'Streaming turns local funk into a global party playlist.' },
    },
    eraCurrency: { analog60s: { code: 'BRL', symbol: 'R$', perDollar: 0.5 }, digital80s: { code: 'BRL', symbol: 'R$', perDollar: 1.0 }, internet2000s: { code: 'BRL', symbol: 'R$', perDollar: 1.8 }, streaming2020s: { code: 'BRL', symbol: 'R$', perDollar: 5 } },
  },
];

export const getCityById = (id?: string | null): City | undefined => CITIES.find((c) => c.id === id);

export const isCityId = (id: unknown): id is CityId => CITIES.some((c) => c.id === id);

/** The state's city, or undefined for legacy saves (neutral). */
export const getCity = (state: Pick<GameState, 'cityId'> | undefined | null): City | undefined =>
  getCityById(state?.cityId);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

const genreIn = (list: readonly string[], genre: string) => list.some((g) => norm(g) === norm(genre));

/** Popularity points added to a genre's era popularity in this city (0 when unknown / neutral). */
export const regionalPopularityDelta = (genre: string, cityId?: string | null): number => {
  const city = getCityById(cityId);
  if (!city) return 0;
  if (genreIn(city.hotGenres, genre)) return HOT_POPULARITY;
  if (genreIn(city.coolGenres, genre)) return COOL_POPULARITY;
  return 0;
};

/** Weight multiplier for an enquiry template of this genre. */
export const regionalEnquiryWeight = (genre: string, cityId?: string | null): number => {
  const city = getCityById(cityId);
  return city && genreIn(city.hotGenres, genre) ? HOT_ENQUIRY_WEIGHT : 1;
};

const DOLLARS: CityCurrency = { code: 'USD', symbol: '$', perDollar: 1 };

/** The currency a city's players read in a given era (era-accurate indexed rates). Neutral = dollars. */
export const currencyFor = (cityId?: string | null, eraId?: string | null): CityCurrency => {
  const city = getCityById(cityId);
  if (!city) return DOLLARS;
  return city.eraCurrency?.[eraId as CityEraId] ?? city.currency;
};

/** Studio dollars → display amount in the city's currency for that era (whole units). */
export const toLocalAmount = (dollars: number, cityId?: string | null, eraId?: string | null): number =>
  Math.round(dollars * currencyFor(cityId, eraId).perDollar);

export const currencySymbol = (cityId?: string | null, eraId?: string | null): string => currencyFor(cityId, eraId).symbol;

/** "£1,240" style display of studio dollars. Negative amounts keep their sign in front. */
export const formatMoney = (dollars: number, cityId?: string | null, eraId?: string | null): string => {
  const local = toLocalAmount(dollars, cityId, eraId);
  return `${local < 0 ? '-' : ''}${currencySymbol(cityId, eraId)}${formatNumber(Math.abs(local))}`;
};

/**
 * Name for a local person: deterministic from `roll1`/`roll2` in [0,1). Returns undefined for a
 * neutral save so callers keep their existing name pool.
 */
export const localName = (cityId: string | null | undefined, roll1: number, roll2: number): string | undefined => {
  const city = getCityById(cityId);
  if (!city) return undefined;
  const pick = <T,>(list: readonly T[], r: number) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
  return `${pick(city.names.first, roll1)} ${pick(city.names.last, roll2)}`;
};

/** City text in the active language (English fallback). Ids are stable keys in `content.json`. */
export const cityText = (city: City) => ({
  tagline: tc(`city.${city.id}.tagline`, city.tagline),
  scene: tc(`city.${city.id}.scene`, city.scene),
  edgeLabel: tc(`city.${city.id}.edge_label`, city.edge.label),
  edgeWhy: tc(`city.${city.id}.edge_why`, city.edge.why),
  blurb: tc(`city.${city.id}.blurb`, city.lore.blurb),
  legend: tc(`city.${city.id}.legend`, city.lore.legend),
  landmarks: city.lore.landmarks.map((l, i) => tc(`city.${city.id}.landmark_${i}`, l)),
});

/** One-line summary of what a city changes, for the picker and the studio strip. */
export const describeCity = (city: City, eraId?: string | null): string[] => {
  const cur = currencyFor(city.id, eraId);
  const text = cityText(city);
  const genres = (list: readonly string[]) => list.join(', ');
  return [
    cur.perDollar === 1
      ? tc('city_ui.currency', 'Currency: {{symbol}} {{code}}', { symbol: cur.symbol, code: cur.code })
      : tc('city_ui.currency_rate', 'Currency: {{symbol}} {{code}} (display only; 1 studio $ = {{symbol}}{{rate}})', { symbol: cur.symbol, code: cur.code, rate: cur.perDollar }),
    tc('city_ui.demand', 'In demand: {{genres}}', { genres: genres(city.hotGenres.slice(0, 3)) }),
    tc('city_ui.slower', 'Slower here: {{genres}}', { genres: genres(city.coolGenres) }),
    tc('city_ui.edge', 'Local edge: +1 {{label}}. {{why}}', { label: text.edgeLabel, why: text.edgeWhy }),
    tc('city_ui.scene', 'Scene: {{scene}}', { scene: text.scene }),
  ];
};

/** The local scene in the player's era, for the lore panel. */
export const cityEraLore = (cityId: string | null | undefined, eraId: string | null | undefined): string | undefined => {
  const city = getCityById(cityId);
  if (!city) return undefined;
  const era = (eraId as CityEraId) in city.lore.eras ? (eraId as CityEraId) : 'streaming2020s';
  return tc(`city.${city.id}.era_${era}`, city.lore.eras[era]);
};

/** A new run's producer gets the city's edge: +1 to one attribute. Idempotent per call site (new games only). */
export const applyCityEdge = <T extends { playerData: { attributes: object } }>(state: T, cityId?: string | null): T => {
  const city = getCityById(cityId);
  if (!city) return state;
  const attr = city.edge.attribute;
  const attrs = state.playerData.attributes as Record<string, number>;
  return {
    ...state,
    playerData: { ...state.playerData, attributes: { ...attrs, [attr]: (attrs[attr] ?? 1) + 1 } },
  } as T;
};
