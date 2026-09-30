import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { Sliders, Volume2, AlertTriangle } from 'lucide-react';

export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

export function evaluateMixOutput(
  faderVal: number,
  panVal: number,
  trackLevel: number,
  targetPan: number
): { inSweetSpot: boolean; isClipping: boolean; scoreDelta: number } {
  const output = trackLevel + (faderVal - 50) * 0.5;
  const isClipping = output > 92;
  const panError = Math.abs(panVal - targetPan);
  const inSweetSpot = output >= 45 && output <= 65 && panError <= 25;

  let scoreDelta = 2;
  if (inSweetSpot) scoreDelta = 10;
  else if (isClipping) scoreDelta = -15;

  return { inSweetSpot, isClipping, scoreDelta };
}

export function calculateConsoleRideScore(inZoneTicks: number, totalTicks: number, clipCount: number): number {
  const ratio = inZoneTicks / Math.max(1, totalTicks);
  const raw = ratio * 1000 - clipCount * 40;
  return Math.max(0, Math.min(1000, Math.round(raw)));
}

// Web Audio Stem Synth for real-time fader and stereo pan demo
class ConsoleAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private osc: OscillatorNode | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15;

        if (typeof this.ctx.createStereoPanner === 'function') {
          this.panner = this.ctx.createStereoPanner();
          this.masterGain.connect(this.panner);
          this.panner.connect(this.ctx.destination);
        } else {
          this.masterGain.connect(this.ctx.destination);
        }

        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 220; // 220Hz A3
        this.osc.connect(this.masterGain);
        this.osc.start();
      }
    }
  }

  update(volumeLevel: number, panRatio: number) {
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const targetGain = Math.max(0, Math.min(0.35, (volumeLevel / 100) * 0.35));
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);

      if (this.panner) {
        const clampedPan = Math.max(-1, Math.min(1, panRatio));
        this.panner.pan.setTargetAtTime(clampedPan, this.ctx.currentTime, 0.04);
      }
    } catch {
      // Audio silent fallback
    }
  }

  stop() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

const consoleAudio = new ConsoleAudio();

export const ConsoleRideGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const [timeLeft, setTimeLeft] = useState(25); // 25 seconds
  const [fader, setFader] = useState(50); // 0-100
  const [pan, setPan] = useState(0); // -100 to +100
  const [trackLevel, setTrackLevel] = useState(50);
  const [targetPan, setTargetPan] = useState(0);
  const [output, setOutput] = useState(50);
  const [inZoneTicks, setInZoneTicks] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [clipCount, setClipCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const faderRef = useRef(50);
  const panRef = useRef(0);
  const trackRef = useRef(50);
  const targetPanRef = useRef(0);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      setGameOver(true);
      consoleAudio.stop();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  // Main tick & simulation loop (100ms)
  useEffect(() => {
    if (gameOver) {
      consoleAudio.stop();
      return;
    }

    const interval = setInterval(() => {
      // Performer signal random fluctuation
      const nextTrack = Math.max(10, Math.min(90, trackRef.current + (Math.random() * 8 - 4)));
      trackRef.current = nextTrack;
      setTrackLevel(nextTrack);

      // Stereo field drift
      const nextTargetPan = Math.max(-70, Math.min(70, targetPanRef.current + (Math.random() * 12 - 6)));
      targetPanRef.current = nextTargetPan;
      setTargetPan(nextTargetPan);

      // Read gamepad sticks continuously
      if (gamepad.isConnected) {
        if (Math.abs(gamepad.leftStick.y) > 0.1) {
          // Invert stick Y: push up increases fader
          const faderDelta = -gamepad.leftStick.y * 3.5;
          const nextFader = Math.max(0, Math.min(100, faderRef.current + faderDelta));
          faderRef.current = nextFader;
          setFader(nextFader);
        }
        if (Math.abs(gamepad.rightStick.x) > 0.1) {
          const panDelta = gamepad.rightStick.x * 4;
          const nextPan = Math.max(-100, Math.min(100, panRef.current + panDelta));
          panRef.current = nextPan;
          setPan(nextPan);
        }
      }

      const out = nextTrack + (faderRef.current - 50) * 0.5;
      setOutput(out);
      setTotalTicks((t) => t + 1);

      const evaluation = evaluateMixOutput(faderRef.current, panRef.current, nextTrack, targetPanRef.current);

      if (evaluation.inSweetSpot) {
        setInZoneTicks((z) => z + 1);
      }
      if (evaluation.isClipping) {
        setClipCount((c) => c + 1);
        gamepad.triggerHaptic(0.6, 0.9, 100);
      }

      // Update synth
      consoleAudio.update(out, panRef.current / 100);
    }, 100);

    return () => {
      clearInterval(interval);
      consoleAudio.stop();
    };
  }, [gameOver, gamepad]);

  // Keyboard controls
  useEffect(() => {
    if (gameOver) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        const next = Math.min(100, faderRef.current + 4);
        faderRef.current = next;
        setFader(next);
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        const next = Math.max(0, faderRef.current - 4);
        faderRef.current = next;
        setFader(next);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        const next = Math.max(-100, panRef.current - 6);
        panRef.current = next;
        setPan(next);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        const next = Math.min(100, panRef.current + 6);
        panRef.current = next;
        setPan(next);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver]);

  const score = calculateConsoleRideScore(inZoneTicks, totalTicks, clipCount);

  const handleFinalize = () => {
    onComplete(score, score >= 500);
  };

  const isClipping = output > 92;
  const inSweetSpot = output >= 45 && output <= 65 && Math.abs(pan - targetPan) <= 25;

  return (
    <MinigameChrome
      title="Analog Console Fader Ride & Stereo Pan"
      subtitle="Ride the channel fader with Left Stick, balance stereo width with Right Stick"
      onClose={onClose}
    >
      <div className="space-y-4 max-w-lg mx-auto select-none">
        {/* Hardware Channel Strip Chassis */}
        <div className="p-5 bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-stone-700/80 rounded-xl shadow-2xl flex flex-col items-center">
          {/* Top Status & VU Meter Section */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div>
              <span className="text-[10px] text-stone-400 font-mono">CHANNEL BUS 01</span>
              <div className="text-xs font-bold text-amber-300">
                Time: <span className="font-mono">{timeLeft}s</span>
              </div>
            </div>

            {/* Live VU Peak Needle Display */}
            <div className="flex flex-col items-center bg-stone-950 px-4 py-2 rounded-lg border border-stone-800 shadow-inner">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono text-stone-400">OUTPUT RMS</span>
                {isClipping && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 animate-pulse">
                    <AlertTriangle size={11} /> CLIP!
                  </span>
                )}
              </div>
              <div className="relative w-44 h-4 bg-stone-900 rounded overflow-hidden border border-stone-700">
                {/* Sweet spot indicator 45% - 65% */}
                <div className="absolute left-[45%] w-[20%] top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-400/60" />
                {/* Red clip zone >92% */}
                <div className="absolute left-[92%] right-0 top-0 bottom-0 bg-red-600/40" />
                {/* Output Level Fill */}
                <div
                  style={{ width: `${Math.min(100, output)}%` }}
                  className={`h-full transition-all duration-75 ${
                    isClipping ? 'bg-red-500' : inSweetSpot ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-stone-400 font-mono">SCORE</span>
              <div className="text-sm font-bold font-mono text-emerald-400">{score}</div>
            </div>
          </div>

          {/* Console Controls Area: Fader (Left) and Pan Knob (Right) */}
          <div className="w-full grid grid-cols-2 gap-4 bg-stone-950/70 p-4 rounded-lg border border-stone-800">
            {/* Left Stick Motorized Vertical Fader */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-2">
                <GamepadGlyph button="ls" size="xs" />
                <span className="text-xs font-bold text-stone-200">FADER (L-Stick)</span>
              </div>

              <div className="relative w-12 h-44 bg-stone-900 border border-stone-700 rounded-md flex justify-center py-2 shadow-inner">
                {/* Center travel slot */}
                <div className="w-1.5 h-full bg-stone-950 rounded-full border border-stone-800" />

                {/* Target Zone Indicator */}
                <div className="absolute left-1 right-1 top-[35%] bottom-[35%] bg-emerald-500/10 border-y border-emerald-500/30 rounded pointer-events-none" />

                {/* Fader Handle */}
                <div
                  style={{
                    bottom: `${fader}%`,
                    transform: 'translateY(50%)',
                  }}
                  className="absolute w-10 h-7 rounded bg-gradient-to-b from-stone-200 via-stone-400 to-stone-500 border border-stone-600 shadow-md flex items-center justify-center transition-all duration-75"
                >
                  <div className="w-6 h-0.5 bg-stone-900/60" />
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-300 mt-2">{fader.toFixed(0)}% GAIN</span>
            </div>

            {/* Right Stick Stereo Pan Potentiometer */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 mb-2">
                <GamepadGlyph button="rs" size="xs" />
                <span className="text-xs font-bold text-stone-200">STEREO PAN (R-Stick)</span>
              </div>

              {/* Circular Pan Knob */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-stone-800 to-stone-950 border-2 border-stone-600 flex items-center justify-center shadow-lg my-2">
                {/* Target Pan Dot */}
                <div
                  style={{
                    transform: `rotate(${targetPan * 1.3}deg) translateY(-46px)`,
                  }}
                  className="absolute w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]"
                />

                {/* Current Pan Indicator needle */}
                <div
                  style={{
                    transform: `rotate(${pan * 1.3}deg)`,
                  }}
                  className="w-1 h-20 bg-transparent flex flex-col justify-start items-center transition-transform duration-75"
                >
                  <div className="w-1.5 h-6 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
                </div>

                <div className="absolute text-[10px] font-mono text-stone-400">
                  {pan === 0 ? 'CENTER' : pan < 0 ? `L ${Math.abs(pan).toFixed(0)}` : `R ${pan.toFixed(0)}`}
                </div>
              </div>

              <div className="flex items-center justify-between w-full px-4 text-[9px] text-stone-500 font-mono">
                <span>HARD L</span>
                <span>CENTER</span>
                <span>HARD R</span>
              </div>
            </div>
          </div>

          {/* Real-time feedback bar */}
          <div className="w-full text-center mt-3 text-xs">
            {isClipping ? (
              <span className="text-red-400 font-bold animate-pulse">PULL FADER DOWN! Digital Clipping Detected!</span>
            ) : inSweetSpot ? (
              <span className="text-emerald-400 font-bold">✨ IN THE SWEET SPOT (+0dB RMS / Balanced Pan)</span>
            ) : (
              <span className="text-stone-400">Adjust sticks to bring mix into the green zone</span>
            )}
          </div>
        </div>

        {gameOver && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-center animate-in zoom-in-95">
            <h4 className="font-bold text-emerald-300 mb-1">Session Take Mixed!</h4>
            <p className="text-xs text-stone-300 mb-3">
              Total Score: <span className="font-mono text-amber-300 font-bold">{score}</span> / 1000
            </p>
            <KenneyButton onClick={handleFinalize} variant="green" className="w-full">
              Collect Mix Rewards
            </KenneyButton>
          </div>
        )}
      </div>

      <DialogFooter className="mt-4">
        {!gameOver && (
          <KenneyButton onClick={() => onComplete(score, score >= 500)} variant="blue">
            Skip to Finish
          </KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
