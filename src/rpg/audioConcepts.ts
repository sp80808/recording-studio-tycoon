/**
 * Audio concept tags (issue #306, backlog 1). Pure data + lookups: minigames,
 * session issue kinds and gear categories point at the real-world concept they
 * exercise, so Know-How can quietly record which concepts the player has met.
 * No UI and no text for the player here; a later codex reads this.
 */
export type AudioConceptId =
  | 'gain-staging'
  | 'eq'
  | 'compression'
  | 'signal-flow'
  | 'polarity'
  | 'mic-placement';

export const AUDIO_CONCEPT_IDS: readonly AudioConceptId[] = [
  'gain-staging', 'eq', 'compression', 'signal-flow', 'polarity', 'mic-placement',
];

export const isAudioConceptId = (v: unknown): v is AudioConceptId =>
  typeof v === 'string' && (AUDIO_CONCEPT_IDS as readonly string[]).includes(v);

/** Minigame ids (MinigameType) to the concepts they exercise. Unlisted games teach none. */
export const MINIGAME_CONCEPTS: Record<string, AudioConceptId[]> = {
  'gain-stage': ['gain-staging'],
  'eq-match': ['eq'],
  'phase-check': ['polarity'],
  'chain-recall': ['signal-flow', 'compression'],
  'bus-merge': ['signal-flow'],
  mixing: ['gain-staging', 'eq'],
  'fader-ride': ['gain-staging'],
  'console-ride': ['gain-staging'],
  effectchain: ['signal-flow', 'compression'],
  mastering: ['eq', 'compression'],
  acoustic: ['mic-placement'],
  vocal: ['mic-placement'],
  'live-recording': ['mic-placement'],
  'fault-hunt': ['signal-flow'],
};

/** Session event ids (src/rpg/sessionIssues.ts) to concepts. */
export const SESSION_EVENT_CONCEPTS: Record<string, AudioConceptId[]> = {
  'noisy-take': ['signal-flow'],
  'translation-issue': ['eq'],
  'clipped-render': ['gain-staging'],
};

/** Gear categories (EquipmentCategory) to concepts. */
export const GEAR_CATEGORY_CONCEPTS: Record<string, AudioConceptId[]> = {
  microphone: ['mic-placement'],
  monitor: ['eq'],
  interface: ['gain-staging', 'signal-flow'],
  outboard: ['compression', 'eq'],
  recorder: ['signal-flow'],
  mixer: ['gain-staging', 'signal-flow'],
};

export const conceptsForMinigame = (minigameType: string | undefined): AudioConceptId[] =>
  (minigameType && MINIGAME_CONCEPTS[minigameType]) || [];

export const conceptsForSessionEvent = (eventId: string | undefined): AudioConceptId[] =>
  (eventId && SESSION_EVENT_CONCEPTS[eventId]) || [];

export const conceptsForGearCategory = (category: string | undefined): AudioConceptId[] =>
  (category && GEAR_CATEGORY_CONCEPTS[category]) || [];
