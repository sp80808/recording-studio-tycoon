import type { MinigameType } from './MinigameManager';

export interface MinigameReward {
  creativityBonus: number;
  technicalBonus: number;
  xpBonus: number;
}

/** [creativity divisor, technical divisor] applied to a 0–1000 score. */
const DIVISORS: Partial<Record<MinigameType, readonly [number, number]>> = {
  rhythm: [8, 12],
  mixing: [12, 8],
  waveform: [10, 10],
  beatmaking: [6, 15],
  vocal: [7, 11],
  mastering: [15, 6],
  effectchain: [8, 10],
  acoustic: [12, 8],
  layering: [9, 11],
  'vocal-tuning': [14, 7],
  'live-recording': [10, 9],
  'eq-match': [12, 8],
  'fader-ride': [15, 6],
  'punch-in': [8, 12],
  'beat-pad': [6, 12],
  'tape-jog': [15, 6],
  'console-ride': [10, 8],
  'album-sequence': [9, 12],
  'vocal-comp': [8, 10],
  'lyric-focus': [6, 14],
  'tape-splicing': [14, 7],
  sampling: [7, 11],
  'fault-hunt': [16, 7],
  'chain-recall': [12, 9],
  'session-scramble': [16, 8],
  'flight-case': [16, 8],
  'gain-stage': [20, 7],
  'phase-check': [18, 7],
  'bus-merge': [14, 8],
};

/**
 * Single score → reward contract shared by the Dialog `MinigameManager` and the
 * in-world `WorldInteraction` harness, so a migrated interaction pays exactly
 * what its minigame did. `maintenance` passes qualityImpact (0–20) + success.
 */
export function computeMinigameReward(type: MinigameType, score: number, success?: boolean): MinigameReward {
  const xpBonus = Math.floor(Math.max(1, score / 50));
  if (type === 'maintenance') {
    return {
      creativityBonus: success ? Math.floor(score / 4) : 0,
      technicalBonus: success ? Math.floor(score / 2) : 0,
      xpBonus,
    };
  }
  const divisors = DIVISORS[type];
  if (!divisors) {
    console.warn(`Unknown game type for reward calculation: ${type}`);
    return { creativityBonus: 0, technicalBonus: 0, xpBonus };
  }
  return {
    creativityBonus: Math.floor(score / divisors[0]),
    technicalBonus: Math.floor(score / divisors[1]),
    xpBonus,
  };
}
