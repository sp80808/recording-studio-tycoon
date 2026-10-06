/**
 * Per-premises world affordance and Studio B-ready property ids (#250).
 * A premises move should unlock something you can see in the Living Studio, not
 * only bigger numbers. Each archetype gets one visible prop (drawn in
 * `studioPremisesDecor.ts`) and one line saying what it is for. Pure data and
 * helpers: no state is added, everything derives from `premisesTier` and the
 * persisted `premisesArchetype`.
 *
 * Property ids are stable strings (`prop:<archetype|band>:<tier>`) so a future
 * "keep the old studio as Studio B" feature can reference a property without the
 * state assuming only the current tier can exist.
 */
import { getArchetypeModifiers, type PremisesArchetype } from '@/rpg/premisesTraits';

export interface PremisesAffordance {
  /** Matches the prop id drawn by `studioPremisesDecor`. */
  propId: string;
  /** Short name of the new thing in the studio. */
  label: string;
  /** What it is for: the verb the space makes possible. */
  verb: string;
}

export const ARCHETYPE_AFFORDANCES: Record<PremisesArchetype, PremisesAffordance> = {
  'project-room': { propId: 'writingNook', label: 'Writing nook', verb: 'Space to write and demo between sessions.' },
  basement: { propId: 'gearBench', label: 'Gear bench', verb: 'A bench to service and fix your own gear.' },
  warehouse: { propId: 'drumRiser', label: 'Rehearsal riser', verb: 'Set a whole band up and rehearse before you record.' },
  commercial: { propId: 'onAirSign', label: 'On-air sign', verb: 'A street-facing address that makes clients feel looked after.' },
  'existing-studio': { propId: 'recordWall', label: 'Record wall', verb: 'Installed history that lends credibility to commercial work.' },
};

/** What the band gives when no archetype was picked (legacy saves and plain moves). */
const BAND_AFFORDANCE: Record<1 | 2 | 3, PremisesAffordance> = {
  1: { propId: 'clientBench', label: 'Client bench', verb: 'Somewhere for clients to wait.' },
  2: { propId: 'reception', label: 'Reception desk', verb: 'Greet and hold clients properly.' },
  3: { propId: 'premiumSofa', label: 'Premium lounge', verb: 'Handle premium clients in comfort.' },
};

type TermsState = { premisesTier?: number; premisesArchetype?: unknown };
const bandOf = (s: TermsState): 0 | 1 | 2 | 3 =>
  s.premisesTier === 1 || s.premisesTier === 2 || s.premisesTier === 3 ? s.premisesTier : 0;

/** The affordance the current premises shows, or null for the borrowed room. A tier-mismatched archetype is ignored. */
export const getPremisesAffordance = (s: TermsState): PremisesAffordance | null => {
  const tier = bandOf(s);
  if (tier === 0) return null;
  return getArchetypeModifiers(s.premisesArchetype, tier) ? ARCHETYPE_AFFORDANCES[s.premisesArchetype as PremisesArchetype] : BAND_AFFORDANCE[tier];
};

/** Stable property id: `prop:warehouse:2`, or `prop:band:1` when no archetype was chosen. Null for the borrowed room. */
export const premisesPropertyId = (s: TermsState): string | null => {
  const tier = bandOf(s);
  if (tier === 0) return null;
  return `prop:${getArchetypeModifiers(s.premisesArchetype, tier) ? (s.premisesArchetype as string) : 'band'}:${tier}`;
};

/** The extra prop id an archetype adds on top of the band furniture, or null. */
export const archetypePropId = (archetype: unknown, tier: number): string | null =>
  getArchetypeModifiers(archetype, tier) ? ARCHETYPE_AFFORDANCES[archetype as PremisesArchetype].propId : null;

/**
 * Move-day relocation beat (#250): what gets packed, that the old room empties,
 * and what appears in the new one. Counts come straight from state so the beat
 * shows the real continuity (nothing is lost on a move).
 */
export interface MoveDayBeat {
  /** Flight cases drawn in the pack-up. */
  cases: number;
  gearCount: number;
  crewCount: number;
  affordance: PremisesAffordance;
}

export const MAX_MOVE_CASES = 8;

export const buildMoveDayBeat = (s: TermsState & { ownedEquipment?: unknown[]; hiredStaff?: unknown[] }): MoveDayBeat | null => {
  const affordance = getPremisesAffordance(s);
  if (!affordance) return null;
  const gearCount = s.ownedEquipment?.length ?? 0;
  const crewCount = s.hiredStaff?.length ?? 0;
  const cases = Math.min(MAX_MOVE_CASES, Math.max(2, Math.ceil(gearCount / 2) + (crewCount > 0 ? 1 : 0)));
  return { cases, gearCount, crewCount, affordance };
};

/** The three visual stages of the beat, keyed by cutscene line index. */
export type MoveDayStage = 'pack' | 'empty' | 'arrive';
export const moveDayStage = (lineIndex: number): MoveDayStage => (lineIndex <= 0 ? 'pack' : lineIndex === 1 ? 'empty' : 'arrive');
