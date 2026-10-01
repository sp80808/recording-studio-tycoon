/**
 * Pure helpers for the persisted `GameState.producerCustomization` (issue #126).
 * Everything returns new objects; callers replace the state slice, never mutate it.
 */
import type { GameState } from '@/types/game';
import type { ProducerBackgroundId, ProducerCustomization } from '@/types/character';
import { PRODUCER_ORIGINS, getProducerOrigin } from '@/narrative/characterOrigins';
import { hashSeed } from '@/simulation/seededRandom';
import {
  DEFAULT_PRODUCER_APPEARANCE,
  buildProducerNpc,
  sanitizeProducerAppearance,
  type ProducerAppearance,
} from '@/features/sprites/producerAppearance';
import type { ModularNpcDefinition } from '@/features/sprites/spriteTypes';

export const DEFAULT_PRODUCER_NAME = 'The Architect';
const MAX_NAME = 24;

const isOriginId = (id: unknown): id is ProducerBackgroundId =>
  typeof id === 'string' && PRODUCER_ORIGINS.some((o) => o.id === id);

const cleanName = (name: unknown): string =>
  (typeof name === 'string' ? name.trim().slice(0, MAX_NAME) : '') || DEFAULT_PRODUCER_NAME;

export interface ProducerCustomizationInput {
  name?: string;
  originId?: unknown;
  appearance?: unknown;
}

/** Build a complete ProducerCustomization from the career-start choices (bad input is repaired). */
export const createProducerCustomization = (input: ProducerCustomizationInput = {}): ProducerCustomization => {
  const origin = getProducerOrigin(isOriginId(input.originId) ? input.originId : PRODUCER_ORIGINS[0].id);
  const name = cleanName(input.name);
  return {
    name,
    moniker: name,
    backgroundId: origin.id,
    playstyle: origin.primaryPlaystyle,
    visualTheme: origin.preferredTheme,
    signatureMotto: 'In Sound We Trust',
    avatarIcon: '🎛️',
    unlockedThemes: [origin.preferredTheme],
    storyFlags: {},
    appearance: sanitizeProducerAppearance(input.appearance),
  };
};

/**
 * Save migration: legacy saves get a customization derived from what they already store
 * (origin id, run seed); a corrupt blob has each bad field repaired individually.
 */
export const migrateProducerCustomization = (state: Pick<GameState, 'producerCustomization' | 'playerData' | 'saveSeed'>): ProducerCustomization => {
  const existing = state.producerCustomization as Partial<ProducerCustomization> | undefined;
  const hasAppearance = !!existing && typeof existing === 'object' && existing.appearance && typeof existing.appearance === 'object';
  const fallbackAppearance: ProducerAppearance = {
    ...DEFAULT_PRODUCER_APPEARANCE,
    seed: state.saveSeed === undefined ? DEFAULT_PRODUCER_APPEARANCE.seed : hashSeed(state.saveSeed) % 100000,
  };
  const base = createProducerCustomization({
    name: existing?.moniker ?? existing?.name,
    originId: existing?.backgroundId ?? state.playerData?.originId,
    appearance: hasAppearance ? existing!.appearance : fallbackAppearance,
  });
  if (!existing || typeof existing !== 'object') return base;
  return {
    ...base,
    signatureMotto: typeof existing.signatureMotto === 'string' ? existing.signatureMotto : base.signatureMotto,
    storyFlags: existing.storyFlags && typeof existing.storyFlags === 'object' ? { ...existing.storyFlags } : base.storyFlags,
  };
};

/** The sprite definition for the player's producer in the current state (derived, never stored). */
export const producerNpcFor = (
  state: Pick<GameState, 'producerCustomization' | 'selectedEra'>,
): ModularNpcDefinition => {
  const c = state.producerCustomization;
  return buildProducerNpc(sanitizeProducerAppearance(c?.appearance), c?.moniker || c?.name || DEFAULT_PRODUCER_NAME, state.selectedEra);
};

/** Immutable update used by any future "change look" flow. */
export const withProducerAppearance = (state: GameState, appearance: ProducerAppearance): GameState => ({
  ...state,
  producerCustomization: {
    ...migrateProducerCustomization(state),
    appearance: sanitizeProducerAppearance(appearance),
  },
});
