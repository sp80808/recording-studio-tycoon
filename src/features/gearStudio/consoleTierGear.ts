/**
 * Console-tier gear animation plan (#81, budget from #46/#74). Pure and renderer-free.
 *
 * Which in-world hardware each studio tier shows (tape reels, valve glow, status LEDs) and how
 * much of it may move. The Living Studio may run at most ONE continuous ambient effect in normal
 * play (the tape reels while a session is running) and none in Focus/Minimal/reduced motion or a
 * hidden tab. Tube glow and status LEDs are state-driven levels applied only when state changes,
 * never per-frame animation.
 */
import { conditionVisuals, type GearActivityBand, type GearSpriteVisualState } from './gearVisualState';

export type ConsoleTierId = 1 | 2 | 3 | 4 | 5;

export interface ConsoleTierGear {
  tier: ConsoleTierId;
  /** Tape machines with a reel pair (tier 1 keeps the baked machine and adds no extra lamps). */
  reelPairs: number;
  /** Reel radius multiplier on the desk plane. */
  reelScale: number;
  /** Reel tint (flagship gold at tier 5). */
  reelTint: number;
  /** Valve (vacuum tube) glow lamps; solid-state tiers have none. */
  tubes: number;
  /** Status LEDs on the outboard deck. */
  statusLeds: number;
}

export const CONSOLE_TIER_GEAR: Readonly<Record<ConsoleTierId, ConsoleTierGear>> = {
  1: { tier: 1, reelPairs: 1, reelScale: 0.45, reelTint: 0xffffff, tubes: 0, statusLeds: 0 },
  2: { tier: 2, reelPairs: 1, reelScale: 0.42, reelTint: 0xffffff, tubes: 2, statusLeds: 2 },
  3: { tier: 3, reelPairs: 1, reelScale: 0.46, reelTint: 0xd6e4ff, tubes: 1, statusLeds: 3 },
  4: { tier: 4, reelPairs: 1, reelScale: 0.5, reelTint: 0xcbd5e1, tubes: 0, statusLeds: 4 },
  5: { tier: 5, reelPairs: 1, reelScale: 0.55, reelTint: 0xf5d68a, tubes: 0, statusLeds: 5 },
};

export const getConsoleTierGear = (tier: number): ConsoleTierGear =>
  CONSOLE_TIER_GEAR[Math.max(1, Math.min(5, Math.round(tier || 1))) as ConsoleTierId];

export interface GearAttentionInput {
  hasActiveProject: boolean;
  /** OS prefers-reduced-motion. */
  reducedMotion?: boolean;
  /** Focus/Minimal presentation (settings.reducedMotion in the app today). */
  focusMode?: boolean;
  hidden?: boolean;
}

export interface GearAttention {
  /** Reels may spin (the single allowed continuous ambient effect). */
  reelsSpin: boolean;
  /** Continuous ambient effects requested; contract is <= 1, and 0 when calm. */
  continuousEffects: 0 | 1;
}

export const gearAttention = (input: GearAttentionInput): GearAttention => {
  const calm = Boolean(input.reducedMotion || input.focusMode || input.hidden);
  const reelsSpin = !calm && input.hasActiveProject;
  return { reelsSpin, continuousEffects: reelsSpin ? 1 : 0 };
};

const TUBE_LEVEL: Readonly<Record<GearActivityBand, number>> = { idle: 0.35, low: 0.5, mid: 0.7, high: 0.85, peak: 1 };

/** Valve glow 0..1: off when unpowered, dimmer when warning (static level, never flickers per frame). */
export const tubeGlowLevel = (state: GearSpriteVisualState): number => {
  if (!state.powered) return 0;
  const base = TUBE_LEVEL[state.activityBand];
  return state.warning ? base * 0.6 : base;
};

export type StatusLedColor = 'off' | 'green' | 'amber' | 'red';

/** Deck LED colour: green ok, amber worn/failing, red overload (peak + warning). */
export const statusLedColor = (state: GearSpriteVisualState): StatusLedColor => {
  if (!state.powered) return 'off';
  if (state.warning && state.activityBand === 'peak') return 'red';
  return state.warning ? 'amber' : 'green';
};

export const STATUS_LED_HEX: Readonly<Record<StatusLedColor, number>> = {
  off: 0x374151, green: 0x22c55e, amber: 0xf59e0b, red: 0xef4444,
};

/** Cache key so the scene only touches sprites when a visible value changes. */
export const gearVisualKey = (state: GearSpriteVisualState, attention: GearAttention): string =>
  `${state.powered}:${state.activityBand}:${state.warning}:${state.transport}:${attention.reelsSpin}`;

/** Authoritative console condition -> warning flag (read-only mirror; never writes condition). */
export const consoleWarning = (condition: number): boolean => conditionVisuals(condition).warningLed;
