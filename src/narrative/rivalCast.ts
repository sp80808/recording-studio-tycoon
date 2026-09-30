/**
 * Rival cast — ties the campaign to the authored lore rivals in studioLore.ts.
 *
 * Before this module the campaign invented a random rival name per node
 * ("Felix Belmont" in Act I) while the rival cutscene introduced Silas Vance,
 * so the story never had a recurring antagonist. Now every campaign node
 * resolves to a lore rival, chosen deterministically from the player's
 * playstyle (Act I) and the branch they picked (Act II / III).
 *
 * Pure data + lookups: no RNG, no state, safe to call from anywhere.
 */
import type { PlaystyleFocus } from '@/types/character';
import { RIVAL_STUDIOS, type RivalStudio } from './studioLore';

/** Game era ids (selectedEra) → lore era ids used by studioLore / ERA_CODEX. */
const LORE_ERA_BY_GAME_ERA: Record<string, string> = {
  classic_rock: 'vintage-warmth',
  analog60s: 'vintage-warmth',
  golden_age: 'retro-glam',
  digital80s: 'retro-glam',
  digital_age: 'digital-revolution',
  internet2000s: 'digital-revolution',
  modern: 'modern-streaming',
  streaming2020s: 'modern-streaming',
};

export const toLoreEraId = (eraId?: string): string =>
  (eraId && (LORE_ERA_BY_GAME_ERA[eraId] ?? (Object.values(LORE_ERA_BY_GAME_ERA).includes(eraId) ? eraId : undefined))) ||
  'vintage-warmth';

/** Lore era ids / legacy career-start ids → progression era ids (the ones ERA_DEFINITIONS uses). */
const GAME_ERA_BY_ANY_ERA: Record<string, string> = {
  'vintage-warmth': 'analog60s',
  'retro-glam': 'digital80s',
  'digital-revolution': 'internet2000s',
  'modern-streaming': 'streaming2020s',
  classic_rock: 'analog60s',
  golden_age: 'digital80s',
  digital_age: 'internet2000s',
  modern: 'streaming2020s',
  analog60s: 'analog60s',
  digital80s: 'digital80s',
  internet2000s: 'internet2000s',
  streaming2020s: 'streaming2020s',
};

export const toGameEraId = (eraId?: string): string => (eraId && GAME_ERA_BY_ANY_ERA[eraId]) || 'analog60s';

const PRIMARY_RIVAL_BY_PLAYSTYLE: Record<PlaystyleFocus, string> = {
  purist: 'black-wax-vault',
  'hit-maker': 'apex-velocity',
  underground: 'distortion-cellar',
  'sound-lab': 'silicon-harmonics',
};

/** Act II rival by the branch the player took out of Act I. */
const ACT2_RIVAL_BY_NODE: Record<string, string> = {
  act2_purist: 'black-wax-vault',
  act2_commercial: 'apex-velocity',
};

/** Act III finale rival by finale node id. */
const FINALE_RIVAL_BY_NODE: Record<string, string> = {
  act3_golden_legend: 'black-wax-vault',
  act3_sonic_alchemy: 'silicon-harmonics',
  act3_billboard_monopoly: 'apex-velocity',
  act3_rogue_factory: 'distortion-cellar',
};

const fallbackRival = (): RivalStudio => RIVAL_STUDIOS[0];

const byId = (id: string): RivalStudio => RIVAL_STUDIOS.find((r) => r.id === id) ?? fallbackRival();

export const getPrimaryRival = (playstyle?: string): RivalStudio =>
  byId(PRIMARY_RIVAL_BY_PLAYSTYLE[(playstyle ?? 'purist') as PlaystyleFocus] ?? 'black-wax-vault');

/** Rival that fronts a given campaign node. Act I keys off playstyle. */
export const getRivalForNode = (nodeId: string, playstyle?: string): RivalStudio => {
  if (ACT2_RIVAL_BY_NODE[nodeId]) return byId(ACT2_RIVAL_BY_NODE[nodeId]);
  if (FINALE_RIVAL_BY_NODE[nodeId]) return byId(FINALE_RIVAL_BY_NODE[nodeId]);
  return getPrimaryRival(playstyle);
};

/** What each rival says at each beat of the campaign. */
export interface RivalLines {
  /** Act I: first contact. */
  taunt: string;
  /** Act II: the rival escalates. */
  challenge: string;
  /** Act III: the showdown. */
  showdown: string;
  /** Epilogue when the player beat them cleanly. */
  defeated: string;
  /** Epilogue when the player won but compromised. */
  respect: string;
}

export const RIVAL_LINES: Record<string, RivalLines> = {
  'black-wax-vault': {
    taunt: '“You have made enough noise for the old rooms to notice. Charts forget. Tape remembers.”',
    challenge: '“Let us see if your wooden walls survive real scrutiny. Bring a master. Leave the excuses.”',
    showdown: '“One reel. One take. Let the lacquer decide which of us was ever listening.”',
    defeated: 'Silas Vance hands you his own hand-labelled reel, unspooled and unmarked. “Keep it. I have nothing left to prove to the tape.”',
    respect: 'Silas Vance nods once from the back of the room. “Not how I would have done it. But it hums.”',
  },
  'apex-velocity': {
    taunt: '“Your room has a nice vibe. Adorable. Ask me what your streams-per-session are.”',
    challenge: '“In this business, cash talks and indie rooms fold. Sign, or spectate.”',
    showdown: '“Hooks every seven seconds. Beat the algorithm, or become its training data.”',
    defeated: 'Chad Sterling deletes the Apex Velocity press release he drafted about you. “Fine. Fine! Send me your rate card.”',
    respect: 'Chad Sterling leaves a voicemail: “The numbers were close. Numbers are never close. Call me.”',
  },
  'distortion-cellar': {
    taunt: '“You mic the room like it might bite. Turn it up until the landlord calls the cops.”',
    challenge: '“Clean is cowardice. Play the festival with us, or watch it from the parking lot.”',
    showdown: '“Every amp in the city is plugged into this warehouse tonight. Do not be the quiet one.”',
    defeated: 'Roxy Riot crowd-surfs your control room door. “Best record the ceiling ever heard!” The ceiling agrees.',
    respect: 'Roxy Riot spits, grins, and signs your console in marker. “Not punk. But loud.”',
  },
  'silicon-harmonics': {
    taunt: '“Your signal chain is charming. Everything is an oscillator if you push enough voltage through it.”',
    challenge: '“There is a frequency in this circuit no one has heard. Do you want to hear it?”',
    showdown: '“Route it. Measure it. Feel the resonance, or explain why you cannot.”',
    defeated: 'Dr. Aris Thorne stares at the oscilloscope for a long time. “The math was wrong. The record is right.”',
    respect: 'Dr. Aris Thorne annotates your schematic in green ink. “Reproducible. Barely. I will allow it.”',
  },
};

export const getRivalLines = (rivalId: string): RivalLines =>
  RIVAL_LINES[rivalId] ?? RIVAL_LINES['black-wax-vault'];

/** Two-letter initials for cutscene portraits ("Silas Vance" → "SV"). */
export const initialsOf = (name: string): string =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '??';

/** Portrait accent colour per rival — drives the cinematic panel glow. */
export const RIVAL_ACCENT: Record<string, string> = {
  'black-wax-vault': '#f59e0b',
  'apex-velocity': '#a855f7',
  'distortion-cellar': '#f43f5e',
  'silicon-harmonics': '#10b981',
};

export const getRivalAccent = (rivalId: string): string => RIVAL_ACCENT[rivalId] ?? '#f59e0b';
