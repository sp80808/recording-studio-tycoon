/**
 * Living studio actors (#190): one readable state per person, derived from existing
 * staff/session state, plus short world reactions. Presentation only: nothing here is
 * saved or feeds back into outcomes.
 */
import type { TakeGrade } from '@/utils/takeFeedback';
import type { ClientRelationship } from '@/types/game';

export type NpcReadableState =
  | 'ready'
  | 'waiting'
  | 'working'
  | 'blocked'
  | 'tired'
  | 'frustrated'
  | 'inspired'
  | 'celebrating'
  | 'leaving';

export const TIRED_ENERGY = 25;
export const FRUSTRATED_MOOD = 30;

export interface StaffReadInput {
  status: string | undefined;
  energy?: number;
  mood?: number;
  hasActiveProject: boolean;
  /** An open session issue the crew could be dealing with. */
  issueOpen: boolean;
}

/** Exactly one state per person, in priority order: gone > tired > blocked > frustrated > working > waiting > ready. */
export function readableStaffState(input: StaffReadInput): NpcReadableState {
  if (input.status === 'On Tour') return 'leaving';
  if (input.status === 'Resting' || (typeof input.energy === 'number' && input.energy < TIRED_ENERGY)) return 'tired';
  const busy = input.status === 'Working' || input.status === 'Training' || input.status === 'Researching';
  if (busy && input.hasActiveProject && input.issueOpen && input.status === 'Working') return 'blocked';
  if (busy && typeof input.mood === 'number' && input.mood < FRUSTRATED_MOOD) return 'frustrated';
  if (busy) return 'working';
  return input.hasActiveProject ? 'waiting' : 'ready';
}

/** A single small glyph over the head; empty when the body language says enough. */
export function readableCue(state: NpcReadableState): { text: string; color: number } {
  switch (state) {
    case 'tired': return { text: 'z', color: 0x91bde8 };
    case 'blocked': return { text: '!', color: 0xff8a5c };
    case 'frustrated': return { text: '#', color: 0xe07a5f };
    case 'waiting': return { text: '…', color: 0xe8c878 };
    case 'inspired': return { text: '★', color: 0xffd166 };
    case 'celebrating': return { text: '✓', color: 0x7bd389 };
    case 'working': return { text: '♪', color: 0x7bd389 };
    default: return { text: '', color: 0xffffff };
  }
}

/** Animation tempo multiplier: tired people move slower, inspired ones a little quicker. */
export function motionTempo(state: NpcReadableState): number {
  if (state === 'tired') return 0.55;
  if (state === 'inspired' || state === 'celebrating') return 1.25;
  if (state === 'frustrated') return 1.1;
  return 1;
}

export interface TakeReaction {
  /** One-shot crew reaction, or null when the take was routine. */
  crew: 'celebrating' | 'inspired' | null;
  /** The artist hesitates after a flat take. */
  artistHesitates: boolean;
}

/** One primary reaction per take (restraint rule from #194): Gold cheers, Silver nods, Solid makes the artist hesitate. */
export function takeReaction(grade: TakeGrade): TakeReaction {
  if (grade === 'Gold') return { crew: 'celebrating', artistHesitates: false };
  if (grade === 'Silver') return { crew: 'inspired', artistHesitates: false };
  return { crew: null, artistHesitates: true };
}

/** How long a take reaction plays. */
export const TAKE_REACTION_MS = 1_100;

/** Damped hop for a crew cheer (px, upward positive). */
export function cheerHop(elapsedMs: number): number {
  if (elapsedMs <= 0 || elapsedMs >= 520) return 0;
  const k = elapsedMs / 520;
  return Math.abs(Math.sin(k * Math.PI * 2)) * 7 * (1 - k);
}

/** Small side-to-side hesitation for the artist (px). */
export function hesitationSway(elapsedMs: number): number {
  if (elapsedMs <= 0 || elapsedMs >= 650) return 0;
  const k = elapsedMs / 650;
  return Math.sin(k * Math.PI * 3) * 2.2 * (1 - k);
}

const FIRST_VISIT = [
  'Nice room. Where do you want me?',
  'First time here. Let us make it count.',
  'Heard good things about this place.',
  'Mind if I warm up in the booth?',
];
const RETURNING = [
  'Back again. Same mic as last time?',
  'Missed this room.',
  'Let us beat our last one.',
];
const REGULAR = [
  'Home sweet studio.',
  'You know how I like it.',
  'Kettle on? Then let us roll.',
];

/**
 * Arrival bark, backed only by the existing client relationship (no second memory model).
 * Deterministic from the session seed so a reload says the same line.
 */
export function arrivalBark(relationship: Pick<ClientRelationship, 'sessionsCompleted'> | undefined, seed: number): string {
  const visits = relationship?.sessionsCompleted ?? 0;
  const pool = visits >= 3 ? REGULAR : visits >= 1 ? RETURNING : FIRST_VISIT;
  return pool[Math.abs(Math.trunc(seed)) % pool.length];
}

/** Bark bubble visibility over time: quick fade in, hold, fade out. */
export const BARK_MS = 3_200;
export function barkAlpha(elapsedMs: number): number {
  if (elapsedMs < 0 || elapsedMs >= BARK_MS) return 0;
  return Math.min(1, elapsedMs / 160, (BARK_MS - elapsedMs) / 400);
}
