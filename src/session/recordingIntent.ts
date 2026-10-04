import type { FocusAllocation } from '@/types/game';

/** Named views of the existing focus allocation; they do not apply rewards. */
export const RECORDING_INTENTS: ReadonlyArray<{ label: string; focus: FocusAllocation }> = [
  { label: 'Performance', focus: { performance: 60, soundCapture: 25, layering: 15 } },
  { label: 'Clean capture', focus: { performance: 20, soundCapture: 60, layering: 20 } },
  { label: 'Texture', focus: { performance: 20, soundCapture: 20, layering: 60 } },
];

export function matchesRecordingIntent(current: FocusAllocation, intent: FocusAllocation): boolean {
  return current.performance === intent.performance && current.soundCapture === intent.soundCapture && current.layering === intent.layering;
}
