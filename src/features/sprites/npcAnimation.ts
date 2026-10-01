/**
 * Presentation-only NPC animation-state contract.
 *
 * Game state decides what an NPC is doing; these states only say how to draw it.
 * Nothing authoritative may wait on an animation finishing. Each state maps to an atlas
 * animation tag (see pipeline/assetConventions.ts: character tags) with a fallback chain,
 * so a character atlas that only ships `idle`/`work`/`celebrate` still renders every state.
 */
export const NPC_ANIMATION_STATES = [
  'idle', 'walk', 'waiting', 'working', 'recording', 'mixing', 'break', 'celebrate', 'leaving',
] as const;

export type NpcAnimationState = (typeof NPC_ANIMATION_STATES)[number] | 'headbob';

export const isNpcAnimationState = (v: unknown): v is NpcAnimationState =>
  v === 'headbob' || (NPC_ANIMATION_STATES as readonly unknown[]).includes(v);

/** Preferred atlas tag per state, most specific first; `idle` is always the terminal fallback. */
export const NPC_STATE_TAGS: Record<NpcAnimationState, readonly string[]> = {
  idle: ['idle'],
  walk: ['walk', 'idle'],
  waiting: ['wait', 'idle'],
  working: ['work', 'idle'],
  recording: ['record', 'work', 'idle'],
  mixing: ['mix', 'work', 'idle'],
  break: ['break', 'idle'],
  celebrate: ['celebrate', 'idle'],
  leaving: ['walk', 'idle'],
  headbob: ['headbob', 'work', 'idle'], // legacy alias kept for existing callers
};

/** First tag in the state's chain that the atlas actually has; null if not even `idle` exists. */
export const resolveNpcTag = (state: NpcAnimationState, availableTags: Iterable<string>): string | null => {
  const have = new Set(availableTags);
  for (const tag of NPC_STATE_TAGS[state] ?? NPC_STATE_TAGS.idle) if (have.has(tag)) return tag;
  return have.has('idle') ? 'idle' : null;
};

/** Reduced set the DOM/SVG renderer has bespoke motion for; every state collapses onto one of these. */
export type DomMotionKind = 'idle' | 'working' | 'headbob' | 'celebrate';
export const domMotionFor = (state: NpcAnimationState): DomMotionKind => {
  switch (state) {
    case 'working': case 'recording': case 'mixing': return 'working';
    case 'headbob': return 'headbob';
    case 'celebrate': return 'celebrate';
    default: return 'idle';
  }
};
