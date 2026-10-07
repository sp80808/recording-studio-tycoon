/**
 * Concept codex (issue #306, backlog 6). Pure data + derivation: a quiet "Things you've learned"
 * collection filled from the concepts the player has met through play (Know-How `conceptsMet`).
 * Unmet concepts show as locked placeholders with no text, so nothing is spoiled or lectured.
 */
import { AUDIO_CONCEPT_IDS, type AudioConceptId } from './audioConcepts';
import { hasMetConcept, noteConceptsMet, createInitialKnowHow, type StudioKnowHow } from './studioKnowHow';

export interface CodexConcept {
  id: AudioConceptId;
  name: string;
  /** Plain-language one-line explanation. */
  line: string;
}

/** English fallback text; locale content files hold English until translated. */
export const CODEX_CONCEPTS: Record<AudioConceptId, CodexConcept> = {
  'gain-staging': {
    id: 'gain-staging', name: 'Gain staging',
    line: 'Set the level at every stage so the signal stays above the noise but below clipping.',
  },
  eq: {
    id: 'eq', name: 'EQ',
    line: 'Boost or cut frequency ranges so each sound has its own space and nothing masks another.',
  },
  compression: {
    id: 'compression', name: 'Compression',
    line: 'Turn down the loud parts to even out dynamics, but squash too hard and the life goes out of it.',
  },
  'signal-flow': {
    id: 'signal-flow', name: 'Signal flow',
    line: 'Follow the path from source to speaker; noise or loss is always introduced at a specific stage.',
  },
  polarity: {
    id: 'polarity', name: 'Polarity',
    line: 'Two mics on one source can cancel each other when out of phase; flip one and the body returns.',
  },
  'mic-placement': {
    id: 'mic-placement', name: 'Mic placement',
    line: 'Distance and angle change the tone more than the mic: close is full and dry, far is airy and roomy.',
  },
};

export const codexNameId = (id: AudioConceptId) => `codex.concept.${id}.name`;
export const codexLineId = (id: AudioConceptId) => `codex.concept.${id}.line`;

export interface CodexEntry {
  id: AudioConceptId;
  met: boolean;
  /** Present only once met. */
  concept?: CodexConcept;
}

/** All concepts in fixed order; unmet ones carry no text. */
export const deriveCodex = (kh: StudioKnowHow | undefined): CodexEntry[] =>
  AUDIO_CONCEPT_IDS.map(id => {
    const met = hasMetConcept(kh, id);
    return met ? { id, met, concept: CODEX_CONCEPTS[id] } : { id, met };
  });

export const codexProgress = (kh: StudioKnowHow | undefined): { met: number; total: number; complete: boolean } => {
  const met = deriveCodex(kh).filter(e => e.met).length;
  return { met, total: AUDIO_CONCEPT_IDS.length, complete: met === AUDIO_CONCEPT_IDS.length };
};

/** One-time reward for completing the whole set: plain XP and a Career badge. No currency or loot. */
export const CODEX_COMPLETE_XP = 150;
export const CODEX_COMPLETE_KEY = 'codex:complete';

export const isCodexRewardClaimed = (kh: StudioKnowHow | undefined): boolean =>
  !!kh?.discoveries.includes(CODEX_COMPLETE_KEY);

/** Like noteConceptsMet, but pays the completion reward exactly once when the set fills. */
export const noteConceptsWithReward = <S extends { studioKnowHow?: StudioKnowHow; playerData: { xp: number } }>(
  game: S,
  concepts: readonly AudioConceptId[],
): S => {
  const noted = noteConceptsMet(game, concepts);
  const kh = noted.studioKnowHow ?? createInitialKnowHow();
  if (!codexProgress(kh).complete || isCodexRewardClaimed(kh)) return noted;
  return {
    ...noted,
    studioKnowHow: { ...kh, discoveries: [...kh.discoveries, CODEX_COMPLETE_KEY] },
    playerData: { ...noted.playerData, xp: noted.playerData.xp + CODEX_COMPLETE_XP },
  };
};
