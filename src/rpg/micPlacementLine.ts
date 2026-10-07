/**
 * Mic-placement take line (issue #306 follow-up). A short, real recording-craft remark tied to the
 * room and mic the take was made with. Deterministic (seeded), no numbers, no stat effect: it only
 * names a concept the player is practising and quietly marks `mic-placement` as met.
 */
import { createSeededRandom } from '@/simulation/seededRandom';
import type { StudioRoomType } from '@/types/game';
import type { AudioConceptId } from './audioConcepts';

export interface MicPlacementLine {
  id: string;
  english: string;
  concept: AudioConceptId;
}

/** English fallback; keys are `mic.line.<room>.<n>` in every content.json. */
export const MIC_LINE_TEXT: Record<StudioRoomType, readonly string[]> = {
  'vocal-suite': [
    'Close on the capsule, the voice came back full and dry. Back off a hand and it would breathe more.',
    'A pop screen and a little off-axis tamed the breath noise without dulling the tone.',
  ],
  'live-room': [
    'With the mic out in the room, the take picked up space and a little bleed. That air is the point.',
    'Pulling the mic back let the room do some of the arranging; closer would have tightened it up.',
  ],
  'mix-suite': [
    'In a treated control room the mic hears less of the walls, so placement matters even more.',
    'Same source, different spot: moving the mic a few inches changes the tone more than swapping it.',
  ],
  'project-studio': [
    'In a small room, close mic placement keeps the walls out of the recording.',
    'Angle the mic slightly off the source and the harsh edge softens without losing presence.',
  ],
};

export const micLineId = (room: StudioRoomType, n: number) => `mic.line.${room}.${n}`;

/** The line for this take, or null when no mic is in the session (nothing to place). */
export const micPlacementLine = (
  room: StudioRoomType | undefined,
  hasMic: boolean,
  seed: string,
): MicPlacementLine | null => {
  if (!hasMic) return null;
  const r: StudioRoomType = room && MIC_LINE_TEXT[room] ? room : 'project-studio';
  const lines = MIC_LINE_TEXT[r];
  const n = Math.floor(createSeededRandom(`${seed}:mic-line`)() * lines.length) % lines.length;
  return { id: micLineId(r, n), english: lines[n], concept: 'mic-placement' };
};
