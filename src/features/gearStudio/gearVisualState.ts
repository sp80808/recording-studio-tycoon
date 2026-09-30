/**
 * Renderer-independent gear presentation state (#81).
 * Authoritative equipment/game state -> GearVisualState -> any renderer (React faceplate, Pixi sprite).
 * Nothing here imports React or Pixi, and nothing here mutates equipment condition.
 */
import { createSeededRandom } from '@/simulation/seededRandom';

export type GearArchetype =
  | 'compressor'
  | 'preamp'
  | 'equalizer'
  | 'tape-machine'
  | 'mixing-console'
  | 'synth'
  | 'microphone'
  | 'studio-monitor'
  | 'digital-rack'
  | 'patchbay';

export type GearTransport = 'stopped' | 'play' | 'record' | 'rewind';
export type GearFidelity = 'living-studio' | 'inspector' | 'minimal';
export type GearConditionBand = 'pristine' | 'used' | 'worn' | 'failing';
export type GearActivityBand = 'idle' | 'low' | 'mid' | 'high' | 'peak';

export interface GearVisualState {
  powered: boolean;
  activity: number; // 0..1
  gainReduction?: number; // 0..1
  overload?: boolean;
  transport?: GearTransport;
  condition: number; // 0..100, read-only mirror of authoritative condition
  selected?: boolean;
}

export type GearPrimitive =
  | 'vu-meter'
  | 'led-meter'
  | 'jewel-lamp'
  | 'rotary-knob'
  | 'toggle-switch'
  | 'push-button-bank'
  | 'tape-reel-pair'
  | 'vacuum-tube-glow'
  | 'transport-buttons';

export interface GearArchetypeConfig {
  archetype: GearArchetype;
  primitives: readonly GearPrimitive[];
  /** Small indicator used in the Living Studio, where detailed DOM is forbidden. */
  indicator: 'needle' | 'led-strip' | 'reel' | 'lamp' | 'tube';
}

export const GEAR_ARCHETYPES: Readonly<Record<GearArchetype, GearArchetypeConfig>> = {
  compressor: { archetype: 'compressor', primitives: ['vu-meter', 'rotary-knob', 'push-button-bank', 'jewel-lamp', 'toggle-switch'], indicator: 'needle' },
  preamp: { archetype: 'preamp', primitives: ['rotary-knob', 'led-meter', 'jewel-lamp', 'toggle-switch'], indicator: 'lamp' },
  equalizer: { archetype: 'equalizer', primitives: ['rotary-knob', 'toggle-switch', 'jewel-lamp'], indicator: 'lamp' },
  'tape-machine': { archetype: 'tape-machine', primitives: ['tape-reel-pair', 'transport-buttons', 'vu-meter', 'jewel-lamp'], indicator: 'reel' },
  'mixing-console': { archetype: 'mixing-console', primitives: ['led-meter', 'rotary-knob', 'toggle-switch', 'jewel-lamp'], indicator: 'led-strip' },
  synth: { archetype: 'synth', primitives: ['rotary-knob', 'push-button-bank', 'led-meter', 'jewel-lamp'], indicator: 'led-strip' },
  microphone: { archetype: 'microphone', primitives: ['vacuum-tube-glow', 'jewel-lamp'], indicator: 'tube' },
  'studio-monitor': { archetype: 'studio-monitor', primitives: ['led-meter', 'jewel-lamp'], indicator: 'lamp' },
  'digital-rack': { archetype: 'digital-rack', primitives: ['led-meter', 'push-button-bank', 'jewel-lamp', 'toggle-switch'], indicator: 'led-strip' },
  patchbay: { archetype: 'patchbay', primitives: ['jewel-lamp'], indicator: 'lamp' },
};

export const GEAR_ARCHETYPE_LIST = Object.keys(GEAR_ARCHETYPES) as GearArchetype[];

/** Per-fidelity rendering budget: Living Studio stays tiny, inspector gets detail. */
export const GEAR_FIDELITY: Readonly<Record<GearFidelity, { updateHz: number; detailedFaceplate: boolean; animated: boolean }>> = {
  'living-studio': { updateHz: 4, detailedFaceplate: false, animated: true },
  inspector: { updateHz: 8, detailedFaceplate: true, animated: true },
  minimal: { updateHz: 0, detailedFaceplate: false, animated: false },
};

export const conditionBand = (condition: number): GearConditionBand => {
  if (condition >= 85) return 'pristine';
  if (condition >= 60) return 'used';
  if (condition >= 30) return 'worn';
  return 'failing';
};

export interface ConditionVisuals {
  band: GearConditionBand;
  lampFlicker: boolean; // lamp flickers (deterministically via phase)
  meterNoise: number; // 0..1 extra needle wobble amplitude
  scratchOpacity: number; // 0..1 cosmetic overlay
  warningLed: boolean;
}

export const conditionVisuals = (condition: number): ConditionVisuals => {
  const band = conditionBand(condition);
  switch (band) {
    case 'pristine': return { band, lampFlicker: false, meterNoise: 0, scratchOpacity: 0, warningLed: false };
    case 'used': return { band, lampFlicker: false, meterNoise: 0.03, scratchOpacity: 0.12, warningLed: false };
    case 'worn': return { band, lampFlicker: false, meterNoise: 0.07, scratchOpacity: 0.3, warningLed: false };
    default: return { band, lampFlicker: true, meterNoise: 0.14, scratchOpacity: 0.5, warningLed: true };
  }
};

export const activityBand = (activity: number): GearActivityBand => {
  if (activity < 0.05) return 'idle';
  if (activity < 0.35) return 'low';
  if (activity < 0.65) return 'mid';
  if (activity < 0.9) return 'high';
  return 'peak';
};

/**
 * Deterministic demo meter: a low-frequency oscillator plus seeded wobble, sampled in steps.
 * Same (seed, time) always yields the same value; seeded, no hidden state.
 */
export const demoMeterLevel = (params: {
  seed: string | number;
  timeMs: number;
  base: number; // 0..1 centre level
  wobble?: number; // 0..1 amplitude
  stepMs?: number;
}): number => {
  const { seed, timeMs, base, wobble = 0.08, stepMs = 250 } = params;
  const step = Math.floor(timeMs / stepMs);
  const rand = createSeededRandom(`${seed}:${step}`);
  const slow = Math.sin((step * stepMs) / 1800) * wobble * 0.6;
  const jitter = (rand() - 0.5) * wobble;
  return Math.max(0.05, Math.min(0.98, base + slow + jitter));
};

/** Serializable adapter consumed by the Living Studio (Pixi) layer. */
export interface GearSpriteVisualState {
  equipmentId: string;
  archetype: GearArchetype;
  powered: boolean;
  activityBand: GearActivityBand;
  warning: boolean;
  transport: GearTransport;
}

export const toSpriteVisualState = (
  equipmentId: string,
  archetype: GearArchetype,
  state: GearVisualState,
  fidelity: GearFidelity = 'living-studio',
): GearSpriteVisualState => ({
  equipmentId,
  archetype,
  powered: state.powered,
  activityBand: fidelity === 'minimal' || !state.powered ? 'idle' : activityBand(state.activity),
  warning: !!state.overload || conditionVisuals(state.condition).warningLed,
  transport: state.transport ?? 'stopped',
});
