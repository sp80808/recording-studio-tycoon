import * as Tone from 'tone';
import { playSound } from '@/utils/audioSystem';
import type { Era, Rarity } from '../lootGenerator';

let isToneStarted = false;

async function ensureAudioContext(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    isToneStarted = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * High-frequency metallic latch striker click + low mechanical tension thump.
 */
export function playConnectorSnap(volume = 0.75): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = Tone.context.rawContext as AudioContext || new AudioContextClass();
    const now = ctx.currentTime;

    // 1. High metallic click
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.045);

    oscGain.gain.setValueAtTime(volume * 0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    // 2. Mechanical low case thump
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    subGain.gain.setValueAtTime(volume * 0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.09);
  } catch {
    playSound('ui-click', volume * 0.5);
  }
}

/**
 * 1/4" TRS or XLR Jack insert sound: friction scrape + spring detent clunk + metallic ring.
 */
export function playJackInsert(volume = 0.85): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = Tone.context.rawContext as AudioContext || new AudioContextClass();
    const now = ctx.currentTime;

    // Metallic barrel friction noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.035);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400, now);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // Mechanical detent latch pop
    const detentOsc = ctx.createOscillator();
    const detentGain = ctx.createGain();
    detentOsc.type = 'triangle';
    detentOsc.frequency.setValueAtTime(680, now + 0.02);
    detentOsc.frequency.exponentialRampToValueAtTime(110, now + 0.09);

    detentGain.gain.setValueAtTime(0, now);
    detentGain.gain.setValueAtTime(volume * 0.7, now + 0.02);
    detentGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    detentOsc.connect(detentGain);
    detentGain.connect(ctx.destination);
    detentOsc.start(now + 0.02);
    detentOsc.stop(now + 0.1);
  } catch {
    playSound('ui-click', volume * 0.6);
  }
}

/**
 * 1/4" Jack pull / remove pop.
 */
export function playJackRemove(volume = 0.6): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = Tone.context.rawContext as AudioContext || new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.05);

    oscGain.gain.setValueAtTime(volume * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    playSound('ui-click', volume * 0.4);
  }
}

/**
 * Electrical ground bond spark / static release.
 */
export function playGroundSpark(volume = 0.5): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = Tone.context.rawContext as AudioContext || new AudioContextClass();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.025);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch {
    playSound('ui-click', volume * 0.3);
  }
}

/**
 * Era- and Rarity-aware analog audition chord.
 */
export async function playAuditionChord(era: Era = '1970s', rarity: Rarity = 'vintage'): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await ensureAudioContext();

    const chordMap: Record<Era, string[]> = {
      '1960s': ['C3', 'G3', 'C4', 'E4'],
      '1970s': ['F3', 'A3', 'C4', 'E4', 'G4'],
      '1980s': ['D3', 'A3', 'D4', 'F#4', 'B4'],
      '1990s': ['E3', 'B3', 'E4', 'G4', 'D5'],
      '2000s': ['A2', 'E3', 'A3', 'C4', 'G4'],
      '2010s': ['C3', 'G3', 'D4', 'E4', 'B4'],
      '2020s': ['F2', 'C3', 'A3', 'C4', 'E4', 'G4'],
    };

    const notes = chordMap[era] || chordMap['1970s'];

    const polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: rarity === 'legendary' || rarity === 'vintage' ? 'triangle8' : 'sine',
      },
      envelope: {
        attack: 0.04,
        decay: 0.25,
        sustain: 0.2,
        release: 0.8,
      },
    }).toDestination();

    polySynth.volume.value = -12;
    polySynth.triggerAttackRelease(notes, '0.75');

    setTimeout(() => {
      try {
        polySynth.dispose();
      } catch {
        // Safe disposal
      }
    }, 1500);
  } catch {
    playSound('project-complete', 0.4);
  }
}
