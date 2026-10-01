/**
 * chainTones.ts
 * Tiny Tone.js voice for Signal Chain Recall pads. Lazy, and silent if audio is unavailable.
 */
import * as Tone from 'tone';

let synth: Tone.Synth | null = null;

export async function playPadTone(note: string, durationSec = 0.22): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (Tone.context.state !== 'running') await Tone.start();
    if (!synth) {
      synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.12, sustain: 0.15, release: 0.2 },
      }).toDestination();
      synth.volume.value = -10;
    }
    synth.triggerAttackRelease(note, durationSec);
  } catch {
    // Audio is a nicety; the lights carry the game.
  }
}
