import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { StandardButton } from '@/types/gamepad';

export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

export type PadType = 'kick' | 'snare' | 'hihat' | 'clap';

export interface RhythmCue {
  id: number;
  pad: PadType;
  targetTimeMs: number;
  hit: boolean;
  grade?: 'Perfect' | 'Great' | 'Good' | 'Miss';
}

export const PAD_MAPPINGS: Record<PadType, { label: string; button: StandardButton; color: string; key: string }> = {
  kick: { label: 'Kick', button: 'south', color: '#10b981', key: 'A / Space' },
  snare: { label: 'Snare', button: 'west', color: '#3b82f6', key: 'X / S' },
  hihat: { label: 'Hi-Hat', button: 'north', color: '#eab308', key: 'Y / D' },
  clap: { label: 'Clap', button: 'east', color: '#ef4444', key: 'B / F' },
};

export function gradePadHit(actualMs: number, targetMs: number): { grade: 'Perfect' | 'Great' | 'Good' | 'Miss'; points: number } {
  const d = Math.abs(actualMs - targetMs);
  if (d <= 30) return { grade: 'Perfect', points: 200 };
  if (d <= 60) return { grade: 'Great', points: 120 };
  if (d <= 100) return { grade: 'Good', points: 60 };
  return { grade: 'Miss', points: 0 };
}

export function calculateBeatPadScore(points: number[]): number {
  return points.reduce((a, b) => a + b, 0);
}

// Lightweight Web Audio drum synthesizer
class DrumSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playDrum(pad: PadType) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const t = this.ctx.currentTime;

      if (pad === 'kick') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      } else if (pad === 'snare') {
        // Noise burst + tone
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(t);
      } else if (pad === 'hihat') {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
      } else if (pad === 'clap') {
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
      }
    } catch {
      // Audio fallback silent
    }
  }
}

const drumAudio = new DrumSynth();

export const BeatPadGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const [activePad, setActivePad] = useState<PadType | null>(null);
  const [cues, setCues] = useState<RhythmCue[]>([]);
  const [scoreList, setScoreList] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastGrade, setLastGrade] = useState<{ grade: string; points: number } | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const elapsedMsRef = useRef<number>(0);

  // Initialize rhythm pattern: 8 beats over 6 seconds
  useEffect(() => {
    const pattern: RhythmCue[] = [
      { id: 1, pad: 'kick', targetTimeMs: 800, hit: false },
      { id: 2, pad: 'hihat', targetTimeMs: 1400, hit: false },
      { id: 3, pad: 'snare', targetTimeMs: 2000, hit: false },
      { id: 4, pad: 'hihat', targetTimeMs: 2600, hit: false },
      { id: 5, pad: 'kick', targetTimeMs: 3200, hit: false },
      { id: 6, pad: 'clap', targetTimeMs: 3800, hit: false },
      { id: 7, pad: 'snare', targetTimeMs: 4400, hit: false },
      { id: 8, pad: 'hihat', targetTimeMs: 5000, hit: false },
    ];
    setCues(pattern);
    startTimeRef.current = Date.now();
  }, []);

  const triggerPad = useCallback(
    (pad: PadType) => {
      drumAudio.playDrum(pad);
      setActivePad(pad);
      setTimeout(() => setActivePad(null), 120);

      const now = Date.now() - startTimeRef.current;
      // Find closest unhit cue for this pad
      const targetCue = cues.find((c) => !c.hit && c.pad === pad && Math.abs(c.targetTimeMs - now) < 300);

      if (targetCue) {
        const grade = gradePadHit(now, targetCue.targetTimeMs);
        setLastGrade(grade);
        setScoreList((prev) => [...prev, grade.points]);
        setCues((prev) =>
          prev.map((c) => (c.id === targetCue.id ? { ...c, hit: true, grade: grade.grade } : c))
        );

        if (grade.grade === 'Perfect') {
          gamepad.triggerHaptic(0.5, 0.7, 80);
        } else if (grade.grade === 'Great') {
          gamepad.triggerHaptic(0.3, 0.5, 60);
        }
      }
    },
    [cues, gamepad]
  );

  // Controller inputs
  useEffect(() => {
    if (gameOver || !gamepad.isConnected) return;

    if (gamepad.justPressed.south) triggerPad('kick');
    if (gamepad.justPressed.west) triggerPad('snare');
    if (gamepad.justPressed.north) triggerPad('hihat');
    if (gamepad.justPressed.east) triggerPad('clap');
  }, [
    gameOver,
    gamepad.isConnected,
    gamepad.justPressed.south,
    gamepad.justPressed.west,
    gamepad.justPressed.north,
    gamepad.justPressed.east,
    triggerPad,
  ]);

  // Keyboard controls
  useEffect(() => {
    if (gameOver) return;

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'a') triggerPad('kick');
      else if (k === 's') triggerPad('snare');
      else if (k === 'd') triggerPad('hihat');
      else if (k === 'f') triggerPad('clap');
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver, triggerPad]);

  // Main game loop (running timeline)
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      elapsedMsRef.current = elapsed;

      // Check if finished
      if (elapsed > 5600) {
        setGameOver(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver]);

  const totalScore = calculateBeatPadScore(scoreList);

  const handleFinalize = () => {
    onComplete(totalScore, totalScore >= 450);
  };

  return (
    <MinigameChrome
      title="MPC Finger-Drumming / Beat Pad"
      subtitle="Punch in the rhythm cues using controller face buttons or keyboard"
      onClose={onClose}
    >
      <div className="space-y-4 max-w-lg mx-auto select-none">
        {/* Rolling Cue Highway */}
        <div className="relative h-20 bg-slate-950 rounded-lg border border-slate-800 p-2 overflow-hidden flex items-center shadow-inner">
          <div className="absolute left-16 top-0 bottom-0 w-1 bg-amber-500/80 shadow-[0_0_10px_#f59e0b] z-10" />
          <div className="absolute left-8 text-[10px] text-amber-400 font-mono font-bold tracking-widest uppercase">
            TARGET
          </div>

          {cues.map((cue) => {
            const currentMs = elapsedMsRef.current;
            const deltaMs = cue.targetTimeMs - currentMs;
            const leftPx = 64 + (deltaMs / 2500) * 320; // 64px is target line

            if (leftPx < -30 || leftPx > 420) return null;

            const config = PAD_MAPPINGS[cue.pad];

            return (
              <div
                key={cue.id}
                style={{
                  left: `${leftPx}px`,
                  backgroundColor: config.color,
                }}
                className={`absolute top-3 w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-md transition-transform duration-75 ${
                  cue.hit ? 'opacity-30 scale-75' : 'scale-100'
                }`}
              >
                {config.label[0]}
              </div>
            );
          })}
        </div>

        {/* Feedback Banner */}
        <div className="h-6 flex items-center justify-between text-xs px-2">
          <div>
            Score: <span className="font-mono text-amber-400 font-bold">{totalScore}</span> / 1600
          </div>
          {lastGrade && (
            <div
              className={`font-bold animate-bounce ${
                lastGrade.grade === 'Perfect'
                  ? 'text-emerald-400'
                  : lastGrade.grade === 'Great'
                  ? 'text-sky-400'
                  : lastGrade.grade === 'Good'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {lastGrade.grade} (+{lastGrade.points})
            </div>
          )}
        </div>

        {/* 2x2 MPC Hardware Pads */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-2xl">
          {(['hihat', 'clap', 'snare', 'kick'] as PadType[]).map((pad) => {
            const cfg = PAD_MAPPINGS[pad];
            const isLit = activePad === pad;

            return (
              <button
                key={pad}
                onClick={() => triggerPad(pad)}
                style={{
                  borderColor: isLit ? cfg.color : '#334155',
                  boxShadow: isLit ? `0 0 24px ${cfg.color}` : 'inset 0 2px 4px rgba(0,0,0,0.6)',
                }}
                className={`h-24 rounded-lg bg-slate-950/80 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 border-2 ${
                  isLit ? 'brightness-125' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <GamepadGlyph button={cfg.button} size="sm" />
                  <span className="font-bold text-slate-200 text-sm tracking-wider uppercase">{cfg.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{cfg.key}</span>
              </button>
            );
          })}
        </div>

        {gameOver && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-center animate-in zoom-in-95">
            <h4 className="font-bold text-emerald-300 mb-1">Beat Recorded!</h4>
            <p className="text-xs text-slate-300 mb-3">
              Final Score: <span className="font-mono text-amber-300 font-bold">{totalScore}</span>
            </p>
            <KenneyButton onClick={handleFinalize} variant="green" className="w-full">
              Collect Studio Rewards
            </KenneyButton>
          </div>
        )}
      </div>

      <DialogFooter className="mt-4">
        {!gameOver && (
          <KenneyButton onClick={() => onComplete(totalScore, totalScore >= 450)} variant="blue">
            Skip to Finish
          </KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
