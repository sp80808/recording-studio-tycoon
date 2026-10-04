/**
 * chainRecall.ts
 * Pure, seeded rules for Signal Chain Recall: the rack lights up a signal path, then goes dark,
 * and the player taps it back (Simon-style recall, written from scratch for RST).
 * The sequence grows one stage per round. Decoy gear on the rack is never in the path.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export interface RackPiece {
  id: string;
  label: string;
  /** Pitch the pad sounds when lit or tapped, so the chain can be learned by ear. */
  note: string;
}

export interface ChainTheme {
  name: string;
  path: RackPiece[];
  decoys: RackPiece[];
}

const p = (id: string, label: string, note: string): RackPiece => ({ id, label, note });

export const CHAIN_THEMES: ChainTheme[] = [
  {
    name: 'Vocal chain',
    path: [p('mic', 'Mic', 'C4'), p('pre', 'Preamp', 'E4'), p('comp', 'Opto Comp', 'G4'), p('eq', 'EQ', 'A4'), p('busb', 'Bus B', 'D5'), p('plate', 'Plate', 'F5')],
    decoys: [p('gate', 'Gate', 'B3'), p('de-esser', 'De-esser', 'B4')],
  },
  {
    name: 'Drum bus',
    path: [p('kickmic', 'Kick Mic', 'C3'), p('di', 'DI Box', 'E3'), p('pre', 'Preamp', 'G3'), p('bus', 'Drum Bus', 'C4'), p('glue', 'Bus Comp', 'E4'), p('tape', 'Tape', 'G4')],
    decoys: [p('snare', 'Snare Mic', 'D4'), p('room', 'Room Mic', 'A3')],
  },
  {
    name: 'Guitar amp',
    path: [p('gtr', 'Guitar', 'D3'), p('stomp', 'Pedal', 'F3'), p('amp', 'Amp', 'A3'), p('cab', 'Cab Mic', 'C4'), p('pre', 'Preamp', 'D4'), p('spring', 'Spring', 'F4')],
    decoys: [p('delay', 'Delay', 'B3'), p('wah', 'Wah', 'E4')],
  },
];

export interface ChainDifficulty {
  length: number;
  startLength: number;
  decoys: number;
  maxStrikes: number;
}

export const CHAIN_DIFFICULTY: Record<1 | 2 | 3, ChainDifficulty> = {
  1: { length: 4, startLength: 2, decoys: 0, maxStrikes: 3 },
  2: { length: 5, startLength: 3, decoys: 1, maxStrikes: 3 },
  3: { length: 6, startLength: 3, decoys: 2, maxStrikes: 2 },
};

export const MAX_REPLAYS = 2;

export type ChainPhase = 'show' | 'input' | 'done';

export interface ChainRecallState {
  theme: string;
  /** Full path, in order. */
  sequence: string[];
  /** Everything on the rack (path + decoys) in a fixed shuffled order. */
  rack: RackPiece[];
  /** How many stages are lit this round. */
  shown: number;
  inputIndex: number;
  strikes: number;
  maxStrikes: number;
  replays: number;
  roundsCleared: number;
  totalRounds: number;
  phase: ChainPhase;
  won: boolean;
}

export function createChainRecall(seed: string | number, difficulty: 1 | 2 | 3 = 1, rng?: RandomSource): ChainRecallState {
  const cfg = CHAIN_DIFFICULTY[difficulty];
  const roll = rng ?? createSeededRandom(`chainrecall:${seed}`);
  const theme = CHAIN_THEMES[randomInt(roll, 0, CHAIN_THEMES.length - 1)];

  // Take a random run of the themed path so the order is learnable but not identical every time.
  const start = randomInt(roll, 0, theme.path.length - cfg.length);
  const path = theme.path.slice(start, start + cfg.length);
  const decoys = theme.decoys.slice(0, cfg.decoys);

  const rack = [...path, ...decoys];
  for (let i = rack.length - 1; i > 0; i--) {
    const j = randomInt(roll, 0, i);
    [rack[i], rack[j]] = [rack[j], rack[i]];
  }
  return {
    theme: theme.name,
    sequence: path.map((x) => x.id),
    rack,
    shown: cfg.startLength,
    inputIndex: 0,
    strikes: 0,
    maxStrikes: cfg.maxStrikes,
    replays: 0,
    roundsCleared: 0,
    totalRounds: cfg.length - cfg.startLength + 1,
    phase: 'show',
    won: false,
  };
}

/** The renderer calls this once the lights have finished flashing. */
export const startInput = (state: ChainRecallState): ChainRecallState =>
  state.phase === 'show' ? { ...state, phase: 'input', inputIndex: 0 } : state;

/** Ask to see the current stages again. Limited, and costs score. */
export const requestReplay = (state: ChainRecallState): ChainRecallState =>
  state.phase === 'input' && state.replays < MAX_REPLAYS
    ? { ...state, phase: 'show', inputIndex: 0, replays: state.replays + 1 }
    : state;

export function tapPad(state: ChainRecallState, padId: string): ChainRecallState {
  if (state.phase !== 'input') return state;
  if (padId !== state.sequence[state.inputIndex]) {
    const strikes = state.strikes + 1;
    return strikes >= state.maxStrikes
      ? { ...state, strikes, phase: 'done', won: false }
      : { ...state, strikes, inputIndex: 0, phase: 'show' };
  }
  const inputIndex = state.inputIndex + 1;
  if (inputIndex < state.shown) return { ...state, inputIndex };
  const roundsCleared = state.roundsCleared + 1;
  if (state.shown >= state.sequence.length) return { ...state, inputIndex, roundsCleared, phase: 'done', won: true };
  return { ...state, inputIndex: 0, shown: state.shown + 1, roundsCleared, phase: 'show' };
}

/** The player gives up. Keeps what was cleared. */
export const giveUp = (state: ChainRecallState): ChainRecallState => ({ ...state, phase: 'done', won: false });

export interface ChainScore {
  total: number;
  tips: string[];
}

/** Standard 0-1000 result: rounds cleared 750, clean run up to 150, no replays up to 100. */
export function scoreChainRecall(state: ChainRecallState): ChainScore {
  const tips: string[] = [];
  const rounds = (state.roundsCleared / Math.max(1, state.totalRounds)) * 750;
  const clean = state.roundsCleared === 0 ? 0 : state.strikes === 0 ? 150 : state.strikes === 1 ? 60 : 0;
  const replay = state.roundsCleared === 0 ? 0 : Math.max(0, 100 - state.replays * 50);
  const total = Math.round(Math.max(0, Math.min(1000, rounds + clean + replay)));
  if (!state.won) tips.push(tc('mg.chainRecall.tip_lost', 'Say the chain out loud as it lights: each pad has its own pitch to hum along with.'));
  if (state.replays > 0) tips.push(tc('mg.chainRecall.tip_replays', 'Replays cost points. Try humming the pitches instead.'));
  return { total, tips };
}
