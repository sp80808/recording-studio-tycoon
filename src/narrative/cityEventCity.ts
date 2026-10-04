import { CITIES } from '@/rpg/cities';
import { SAGA_CITY_BY_EVENT } from './citySagas';

/** City prefixes used by `cityEvents.ts` event ids. */
const PREFIXES: Record<string, string> = {
  la: 'los-angeles', nashville: 'nashville', london: 'london', berlin: 'berlin', tokyo: 'tokyo', tok: 'tokyo', rio: 'rio', detroit: 'detroit', lagos: 'lagos',
};

/** Which city an event belongs to (for the scene card), or undefined for non-city events. */
export const cityForEvent = (eventId: string): string | undefined => {
  if (SAGA_CITY_BY_EVENT[eventId]) return SAGA_CITY_BY_EVENT[eventId];
  const city = PREFIXES[eventId.split('_')[0]];
  return city && CITIES.some((c) => c.id === city) ? city : undefined;
};
