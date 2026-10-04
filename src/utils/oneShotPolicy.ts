/**
 * One-shot UI SFX policy (#256). Pure and clock-injectable so it is unit
 * testable without an AudioContext.
 *
 * - UI/SFX never loop; only music/ambience may.
 * - Identical sounds inside a short cooldown are dropped centrally, so a
 *   re-render, effect replay, or two input paths for one action cannot stack clicks.
 */
export type AudioChannel = 'sfx' | 'music';

/** Default cooldown for an identical one-shot (ms). */
export const ONE_SHOT_COOLDOWN_MS = 80;

/** Loop is honoured for music only; SFX are always one-shots. */
export const resolveLoop = (channel: AudioChannel, requested: boolean): boolean => channel === 'music' && requested;

export class OneShotGate {
  private last = new Map<string, number>();
  constructor(private readonly now: () => number = Date.now) {}

  /** true = play, false = drop (same key fired inside the cooldown). */
  admit(key: string, cooldownMs: number = ONE_SHOT_COOLDOWN_MS): boolean {
    const t = this.now();
    const prev = this.last.get(key);
    if (prev !== undefined && t - prev < cooldownMs) return false;
    this.last.set(key, t);
    return true;
  }

  reset(): void { this.last.clear(); }
}

/** Semantic UI sound names understood by playUISound. Unknown names play nothing. */
export const UI_SOUND_TYPES = [
  'buttonClick', 'success', 'levelUp', 'purchase', 'error', 'hover', 'cashRegister', 'projectComplete',
  'stageComplete', 'trainingComplete', 'notification', 'notice', 'menuOpen', 'menuClose', 'staffUnavailable',
  'unavailable', 'tactileClick', 'gearSwitch', 'event', 'reviewReveal', 'workTick', 'comboUp', 'rankS', 'rankSPlus',
] as const;
export type UISoundType = (typeof UI_SOUND_TYPES)[number];
export const isKnownUISound = (name: string): name is UISoundType => (UI_SOUND_TYPES as readonly string[]).includes(name);
