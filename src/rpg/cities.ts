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

export type CityId = 'los-angeles' | 'nashville' | 'london' | 'berlin' | 'tokyo' | 'rio';

export const DEFAULT_CITY_ID: CityId = 'los-angeles';

export interface CityCurrency {
  code: string;
  symbol: string;
  /** Local units per studio dollar. Display only. */
  perDollar: number;
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
  /** Local band-name flavour words (used for the region-flavoured session musicians' line-up notes). */
  scene: string;
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

/** Studio dollars → display amount in the city's currency (whole units). */
export const toLocalAmount = (dollars: number, cityId?: string | null): number => {
  const rate = getCityById(cityId)?.currency.perDollar ?? 1;
  return Math.round(dollars * rate);
};

export const currencySymbol = (cityId?: string | null): string => getCityById(cityId)?.currency.symbol ?? '$';

/** "£1,240" style display of studio dollars. Negative amounts keep their sign in front. */
export const formatMoney = (dollars: number, cityId?: string | null): string => {
  const local = toLocalAmount(dollars, cityId);
  return `${local < 0 ? '-' : ''}${currencySymbol(cityId)}${Math.abs(local).toLocaleString()}`;
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

/** One-line summary of what a city changes, for the picker and the studio strip. */
export const describeCity = (city: City): string[] => [
  `Currency: ${city.currency.symbol} ${city.currency.code}${city.currency.perDollar === 1 ? '' : ` (display only; 1 studio $ = ${city.currency.symbol}${city.currency.perDollar})`}`,
  `In demand: ${city.hotGenres.slice(0, 3).join(', ')}`,
  `Slower here: ${city.coolGenres.join(', ')}`,
  `Scene: ${city.scene}`,
];
