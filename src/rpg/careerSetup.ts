/**
 * New-career setup model (#204). Pure: no React, no randomness except the injected rng.
 *
 * The setup is two surfaces, not four pages:
 *   place  - city + era (compared side by side)
 *   person - producer name + look + origin
 * Every choice always holds a valid value, so Quick start can enter the studio with zero clicks.
 */
import { AVAILABLE_ERAS } from '@/data/eras';
import { PRODUCER_ORIGINS } from '@/narrative/characterOrigins';
import type { ProducerBackgroundId } from '@/types/character';
import { CITIES, DEFAULT_CITY_ID, currencyFor, formatMoney, getCityById, localName, type CityId } from '@/rpg/cities';

export const SETUP_SURFACES = ['place', 'person'] as const;
export type SetupSurface = (typeof SETUP_SURFACES)[number];

export const DEFAULT_ERA_ID = 'modern';
export const DEFAULT_PRODUCER_NAME = 'The Architect';

/** What each era asks of you: one line of gameplay, not just flavour. */
export const ERA_CHALLENGE: Record<string, string> = {
  classic_rock: 'Tape is expensive and mistakes are permanent. Every take counts.',
  golden_age: 'Synths and MTV: gloss sells, but the gear bills arrive fast.',
  digital_age: 'Files leak and CDs fade. Stay ahead of the disruption.',
  modern: 'Everyone has a home studio. Win on taste and relationships.',
};

export interface CareerSetupChoices {
  cityId: CityId;
  eraId: string;
  originId: ProducerBackgroundId;
  name: string;
}

export const defaultCareerSetup = (): CareerSetupChoices => ({
  cityId: DEFAULT_CITY_ID,
  eraId: DEFAULT_ERA_ID,
  originId: PRODUCER_ORIGINS[0].id,
  name: DEFAULT_PRODUCER_NAME,
});

/** True when every choice resolves to real content. */
export const isSetupValid = (c: CareerSetupChoices): boolean =>
  !!getCityById(c.cityId) &&
  AVAILABLE_ERAS.some((e) => e.id === c.eraId) &&
  PRODUCER_ORIGINS.some((o) => o.id === c.originId) &&
  c.name.trim().length > 0;

/** Surface A needs a city and era; surface B needs a name and origin. */
export const isSurfaceReady = (surface: SetupSurface, c: CareerSetupChoices): boolean =>
  surface === 'place'
    ? !!getCityById(c.cityId) && AVAILABLE_ERAS.some((e) => e.id === c.eraId)
    : c.name.trim().length > 0 && PRODUCER_ORIGINS.some((o) => o.id === c.originId);

/** Quick start / Surprise me: a seeded, always-valid run. Same seed, same studio. */
export const quickStartSetup = (rng: () => number): CareerSetupChoices => {
  const pick = <T,>(list: readonly T[]): T => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  const cityId = pick(CITIES).id;
  const eraId = pick(AVAILABLE_ERAS).id;
  const originId = pick(PRODUCER_ORIGINS).id;
  const name = (localName(cityId, rng(), rng()) ?? DEFAULT_PRODUCER_NAME).slice(0, 24);
  return { cityId, eraId, originId, name };
};

export interface OpeningBrief {
  /** "LONDON · 1980s" */
  headline: string;
  cityName: string;
  eraName: string;
  accent: string;
  startingCash: string;
  currencyCode: string;
  challenge: string;
}

/** The identity of the studio the player is about to open; drives the preview and the move-in transition. */
export const openingBrief = (cityId: string, eraId: string): OpeningBrief | null => {
  const city = getCityById(cityId);
  const era = AVAILABLE_ERAS.find((e) => e.id === eraId);
  if (!city || !era) return null;
  return {
    headline: `${city.name.toUpperCase()} · ${era.startYear}s`,
    cityName: city.name,
    eraName: era.displayName,
    accent: city.accent,
    startingCash: formatMoney(era.startingMoney, city.id, era.id),
    currencyCode: currencyFor(city.id, era.id).code,
    challenge: ERA_CHALLENGE[era.id] ?? '',
  };
};
