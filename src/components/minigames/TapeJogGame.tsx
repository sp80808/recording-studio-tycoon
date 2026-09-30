import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { Disc } from 'lucide-react';

export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

export function gradeTapeSplice(
  markedIn: number,
  markedOut: number,
  targetIn: number,
  targetOut: number
): { accuracy: number; points: number } {
  const errIn = Math.abs(markedIn - targetIn);
  const errOut = Math.abs(markedOut - targetOut);
  const totalErr = errIn + errOut;

  if (totalErr === 0) {
    return { accuracy: 100, points: 250 };
  }

  const accuracy = Math.max(0, Math.min(100, Math.round(100 - totalErr * 2.5)));
  const points = Math.max(0, Math.min(250, Math.round(250 - totalErr * 12)));
  return { accuracy, points };
}

export function calculateScrubSpeed(stickX: number): number {
  if (Math.abs(stickX) < 0.1) return 0;
  return Math.sign(stickX) * Math.pow(Math.abs(stickX), 1.5) * 20;
}

// Lightweight Web Audio tape sound engine
class TapeAudio {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0;
        this.gain.connect(this.ctx.destination);

        this.osc = this.ctx.createOscillator();
        this.osc.type = 'triangle';
        this.osc.frequency.value = 180;
        this.osc.connect(this.gain);
        this.osc.start();
      }
    }
  }

  updateScrub(speed: number) {
    try {
      this.initCtx();
      if (!this.ctx || !this.osc || !this.gain) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const absSpeed = Math.abs(speed);
      if (absSpeed < 0.5) {
        this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      } else {
        const freq = Math.max(40, Math.min(800, absSpeed * 35 + 80));
        this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
        const volume = Math.min(0.2, (absSpeed / 20) * 0.2);
        this.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.03);
      }
    } catch {
      // Audio silent fallback
    }
  }

  playSpliceSnap() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'square';
      snapOsc.frequency.setValueAtTime(800, t);
      snapOsc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
      snapGain.gain.setValueAtTime(0.5, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(t);
      snapOsc.stop(t + 0.08);
    } catch {
      // Silent fallback
    }
  }

  stop() {
    if (this.gain && this.ctx) {
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

const tapeAudio = new TapeAudio();

export const TapeJogGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const TOTAL_CUTS = 4;
  const [currentCut, setCurrentCut] = useState(0);
  const [tapePos, setTapePos] = useState(20); // 0 - 100
  const [markedIn, setMarkedIn] = useState<number | null>(null);
  const [markedOut, setMarkedOut] = useState<number | null>(null);
  const [targetRegion, setTargetRegion] = useState({ inPoint: 45, outPoint: 65 });
  const [cutResults, setCutResults] = useState<{ accuracy: number; points: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [reelAngle, setReelAngle] = useState(0);

  // Setup target glitch region for each take
  useEffect(() => {
    const inPt = Math.floor(Math.random() * 30) + 30; // 30 - 60
    const outPt = inPt + Math.floor(Math.random() * 15) + 12; // +12-27 width
    setTargetRegion({ inPoint: inPt, outPoint: outPt });
    setTapePos(15);
    setMarkedIn(null);
    setMarkedOut(null);
  }, [currentCut]);

  // Scrub update loop
  useEffect(() => {
    if (gameOver) {
      tapeAudio.stop();
      return;
    }

    const interval = setInterval(() => {
      let speed = 0;
      if (gamepad.isConnected) {
        const stickX = Math.abs(gamepad.leftStick.x) > 0.1 ? gamepad.leftStick.x : gamepad.rightStick.x;
        speed = calculateScrubSpeed(stickX);
      }

      if (speed !== 0) {
        setTapePos((prev) => Math.max(0, Math.min(100, prev + speed * 0.05)));
        setReelAngle((prev) => (prev + speed * 2) % 360);
        tapeAudio.updateScrub(speed);

        if (Math.abs(speed) > 10) {
          gamepad.triggerHaptic(0.1, 0.15, 30);
        }
      } else {
        tapeAudio.updateScrub(0);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      tapeAudio.stop();
    };
  }, [gameOver, gamepad]);

  // Marker placements
  const handleMarkIn = useCallback(() => {
    const inVal = Math.round(tapePos);
    setMarkedIn(inVal);
    gamepad.triggerHaptic(0.2, 0.4, 50);
  }, [tapePos, gamepad]);

  const handleMarkOut = useCallback(() => {
    const outVal = Math.round(tapePos);
    setMarkedOut(outVal);
    gamepad.triggerHaptic(0.2, 0.4, 50);
  }, [tapePos, gamepad]);

  // Razor Slice
  const handleSlice = useCallback(() => {
    if (gameOver || markedIn === null || markedOut === null) return;

    tapeAudio.playSpliceSnap();
    gamepad.triggerHaptic(0.6, 0.8, 120);

    const actualIn = Math.min(markedIn, markedOut);
    const actualOut = Math.max(markedIn, markedOut);

    const result = gradeTapeSplice(actualIn, actualOut, targetRegion.inPoint, targetRegion.outPoint);
    setCutResults((prev) => [...prev, result]);

    if (currentCut >= TOTAL_CUTS - 1) {
      setGameOver(true);
    } else {
      setCurrentCut((c) => c + 1);
    }
  }, [gameOver, markedIn, markedOut, targetRegion, currentCut, gamepad]);

  // Controller buttons for In/Out/Slice
  useEffect(() => {
    if (gameOver || !gamepad.isConnected) return;

    if (gamepad.justPressed.lt || (gamepad.triggers.left > 0.5 && markedIn === null)) {
      handleMarkIn();
    }
    if (gamepad.justPressed.rt || (gamepad.triggers.right > 0.5 && markedOut === null)) {
      handleMarkOut();
    }
    if (gamepad.justPressed.south) {
      handleSlice();
    }
  }, [gameOver, gamepad, markedIn, markedOut, handleMarkIn, handleMarkOut, handleSlice]);

  // Keyboard navigation
  useEffect(() => {
    if (gameOver) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setTapePos((p) => Math.max(0, p - 2));
        setReelAngle((a) => (a - 15) % 360);
      } else if (e.key === 'ArrowRight') {
        setTapePos((p) => Math.min(100, p + 2));
        setReelAngle((a) => (a + 15) % 360);
      } else if (e.key.toLowerCase() === 'i') {
        handleMarkIn();
      } else if (e.key.toLowerCase() === 'o') {
        handleMarkOut();
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleSlice();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver, handleMarkIn, handleMarkOut, handleSlice]);

  const totalScore = cutResults.reduce((sum, r) => sum + r.points, 0);

  const handleFinalize = () => {
    onComplete(totalScore, totalScore >= 600);
  };

  return (
    <MinigameChrome
      title="Reel-to-Reel Tape Jog & Splice"
      subtitle="Scrub the tape using analog thumbsticks, mark punch In/Out points, and slice"
      onClose={onClose}
    >
      <div className="space-y-4 max-w-lg mx-auto select-none">
        {/* Tape Machine Deck Display */}
        <div className="relative p-5 bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-stone-700/80 rounded-xl shadow-2xl flex flex-col items-center">
          {/* Dual Rotating Tape Reels */}
          <div className="w-full flex items-center justify-between px-6 mb-4">
            <div className="flex flex-col items-center">
              <div
                style={{ transform: `rotate(${reelAngle}deg)` }}
                className="w-20 h-20 rounded-full border-4 border-stone-600 bg-stone-800 flex items-center justify-center shadow-lg transition-transform"
              >
                <Disc size={64} className="text-stone-400" />
              </div>
              <span className="text-[10px] text-stone-400 font-mono mt-1">SUPPLY REEL</span>
            </div>

            {/* Magnetic Playhead Center Block */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-14 bg-gradient-to-b from-amber-600 to-amber-800 rounded border border-amber-400 flex items-center justify-center shadow-md">
                <span className="text-[8px] font-bold text-amber-100 uppercase tracking-tighter">HEAD</span>
              </div>
              <div className="w-1 h-3 bg-red-500 rounded-full mt-1 animate-pulse" />
            </div>

            <div className="flex flex-col items-center">
              <div
                style={{ transform: `rotate(${reelAngle}deg)` }}
                className="w-20 h-20 rounded-full border-4 border-stone-600 bg-stone-800 flex items-center justify-center shadow-lg transition-transform"
              >
                <Disc size={64} className="text-stone-400" />
              </div>
              <span className="text-[10px] text-stone-400 font-mono mt-1">TAKE-UP REEL</span>
            </div>
          </div>

          {/* Magnetic Tape Ribbon & Waveform Strip */}
          <div className="relative w-full h-16 bg-stone-950 rounded-lg border border-stone-800 overflow-hidden flex items-center shadow-inner">
            {/* Target Glitch / Off-key take region */}
            <div
              style={{
                left: `${targetRegion.inPoint}%`,
                width: `${targetRegion.outPoint - targetRegion.inPoint}%`,
              }}
              className="absolute top-0 bottom-0 bg-red-500/25 border-x-2 border-red-500/80 flex items-center justify-center z-0"
            >
              <span className="text-[9px] font-bold text-red-300 uppercase tracking-widest">GLITCH TAKE</span>
            </div>

            {/* Marked In Point */}
            {markedIn !== null && (
              <div
                style={{ left: `${markedIn}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] z-20"
              >
                <span className="absolute -top-3 -left-2 text-[9px] font-bold text-emerald-400 font-mono">IN</span>
              </div>
            )}

            {/* Marked Out Point */}
            {markedOut !== null && (
              <div
                style={{ left: `${markedOut}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-[0_0_8px_#38bdf8] z-20"
              >
                <span className="absolute -top-3 -left-2 text-[9px] font-bold text-sky-400 font-mono">OUT</span>
              </div>
            )}

            {/* Magnetic Playhead Center Needle */}
            <div
              style={{ left: `${tapePos}%` }}
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_#fbbf24] z-30 transition-all duration-75"
            >
              <div className="w-2.5 h-2.5 bg-amber-400 -translate-x-[3px] rotate-45" />
            </div>
          </div>

          {/* Cut Progress & Info */}
          <div className="w-full flex items-center justify-between text-xs text-stone-300 mt-3 px-1">
            <div>
              Splice <span className="font-bold text-amber-400">{currentCut + 1}</span> of {TOTAL_CUTS}
            </div>
            <div>
              Tape Head: <span className="font-mono text-amber-300">{tapePos.toFixed(1)}%</span>
            </div>
            <div>
              Score: <span className="font-mono text-emerald-400 font-bold">{totalScore}</span> / 1000
            </div>
          </div>
        </div>

        {/* Tactile Control Buttons Bar */}
        <div className="grid grid-cols-3 gap-2">
          <KenneyButton
            onClick={handleMarkIn}
            variant="yellow"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs"
          >
            <GamepadGlyph button="lt" size="xs" />
            <span>Mark In</span>
          </KenneyButton>

          <KenneyButton
            onClick={handleSlice}
            disabled={markedIn === null || markedOut === null}
            variant="green"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold"
          >
            <GamepadGlyph button="south" size="xs" />
            <span>Razor Slice</span>
          </KenneyButton>

          <KenneyButton
            onClick={handleMarkOut}
            variant="yellow"
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs"
          >
            <GamepadGlyph button="rt" size="xs" />
            <span>Mark Out</span>
          </KenneyButton>
        </div>

        {gameOver && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-center animate-in zoom-in-95">
            <h4 className="font-bold text-emerald-300 mb-1">Master Tape Spliced!</h4>
            <p className="text-xs text-stone-300 mb-3">
              Total Score: <span className="font-mono text-amber-300 font-bold">{totalScore}</span> / 1000
            </p>
            <KenneyButton onClick={handleFinalize} variant="green" className="w-full">
              Finalize Master Take
            </KenneyButton>
          </div>
        )}
      </div>

      <DialogFooter className="mt-4">
        {!gameOver && (
          <KenneyButton onClick={() => onComplete(totalScore, totalScore >= 600)} variant="blue">
            Skip to Finish
          </KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
