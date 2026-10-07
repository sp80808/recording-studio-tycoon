/**
 * @fileoverview Fader Ride Minigame - Dynamic Vocal Riding on Console Channel Strip
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Interactive 100mm console channel fader simulation.
 * Players ride dynamic level variations of a vocal/lead track to maintain target output
 * within the calibrated green zone (40-60%) without clipping.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration, triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { tc } from '@/i18n/content';

export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

import {
  ZONE_LO, ZONE_HI, CLIP_LEVEL, TICK_MS, PASS_SCORE, trackLevelAt, outputLevel, inZone as isInZone,
  isRunComplete, runProgress, secondsLeft, scoreRide,
} from '@/minigames/faderRide';

// Web Audio Dynamic Lead & Vocal Synth
class FaderAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private currentStep = 0;
  private faderGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(3200, this.ctx.currentTime);

      this.faderGain = this.ctx.createGain();
      this.faderGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      this.filter.connect(this.faderGain);
      this.faderGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio fallback
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setFaderLevel(val: number) {
    this.init();
    if (!this.ctx || !this.faderGain) return;
    const now = this.ctx.currentTime;
    // Map 0-100 to gain multiplier (0.0 to 1.8)
    const gain = (val / 50) * 0.7;
    this.faderGain.gain.setTargetAtTime(gain, now, 0.03);
  }

  startAudio() {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    this.loopInterval = setInterval(() => {
      this.playNoteStep();
    }, 200);
  }

  stopAudio() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  private playNoteStep() {
    if (!this.ctx || !this.filter) return;
    const now = this.ctx.currentTime;
    const notes = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 220];
    const freq = notes[this.currentStep % notes.length];
    this.currentStep++;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0.01, now);
    env.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(env);
    env.connect(this.filter);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  dispose() {
    this.stopAudio();
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // Safe
      }
      this.ctx = null;
    }
  }
}

export const FaderRideGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [gameOver, setGameOver] = useState(false);
  const [trackLevel, setTrackLevel] = useState(50);
  const [fader, setFader] = useState(50);
  const [output, setOutput] = useState(50);
  const [inZoneTicks, setInZoneTicks] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [maxOutput, setMaxOutput] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const faderRef = useRef(50);
  const trackRef = useRef(50);
  const engineRef = useRef<FaderAudioEngine>(new FaderAudioEngine());
  const faderTrackRef = useRef<HTMLDivElement>(null);
  const [isDraggingFader, setIsDraggingFader] = useState(false);

  // Initialize Audio
  useEffect(() => {
    engineRef.current.startAudio();
    return () => {
      engineRef.current.dispose();
    };
  }, []);

  // Sync Audio Fader
  useEffect(() => {
    engineRef.current.setFaderLevel(fader);
  }, [fader]);

  // Track level random walk + natural musical dynamic swells
  useEffect(() => {
    if (gameOver) return;
    let stepCount = 0;

    const id = setInterval(() => {
      stepCount++;
      // Natural vocal swell: combination of sine wave chorus swells + randomized dynamics
      const next = trackLevelAt(stepCount, Math.random() * 12 - 6);

      trackRef.current = next;
      setTrackLevel(next);

      // Output calculation: fader balances the track level
      const clampedOut = outputLevel(next, faderRef.current);
      setOutput(clampedOut);

      setTotalTicks(t => t + 1);
      setMaxOutput(m => Math.max(m, clampedOut));

      if (isInZone(clampedOut)) {
        setInZoneTicks(c => c + 1);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [gameOver]);

  const handleFaderChange = (v: number) => {
    if (gameOver) return;
    const clamped = Math.max(0, Math.min(100, v));
    faderRef.current = clamped;
    setFader(clamped);
    void gameAudio.playSliderMove();
  };

  // Vertical Touch / Mouse dragging on the console fader track
  const handleFaderPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = faderTrackRef.current;
    if (!track || gameOver) return;
    const rect = track.getBoundingClientRect();
    const clientY = e.clientY;
    // Invert: top is 100, bottom is 0
    const ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const val = Math.round(ratio * 100);
    handleFaderChange(val);
  };

  const timeLeft = secondsLeft(totalTicks);
  const progress = runProgress(totalTicks) * 100;
  const score = scoreRide(inZoneTicks, totalTicks, maxOutput);
  const noClip = maxOutput <= CLIP_LEVEL;
  const inZone = isInZone(output);
  const streak = Math.floor(inZoneTicks / 6);
  const finishedRef = useRef(false);

  const finalize = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setGameOver(true);
    if (score >= PASS_SCORE) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }
    onComplete(score, score >= PASS_SCORE);
  }, [score, onComplete]);

  // The run scores itself when the clock hits zero, so no one has to ride and click at once.
  useEffect(() => {
    if (isRunComplete(totalTicks)) finalize();
  }, [totalTicks, finalize]);

  const toggleSound = () => {
    if (isPlaying) {
      engineRef.current.stopAudio();
      setIsPlaying(false);
    } else {
      engineRef.current.startAudio();
      setIsPlaying(true);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.FaderRideGame.title', '🎛️ Fader Ride Challenge')}
        score={score}
        timeLeft={timeLeft}
        streak={streak}
        accent="green"
      >
        <CardContent className="space-y-4 pt-1">
          {/* Header instructions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            <div>
              <p className="text-emerald-200 text-sm font-medium">
                Ride the vertical studio fader to keep the dynamic track inside the calibrated green window (40-60%)!
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Counter loud vocal swells by pulling back, and push up during quiet phrases. Avoid clipping!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleSound}
                className="h-7 px-2 border-stone-600 text-stone-300 hover:bg-stone-800"
              >
                {isPlaying ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
              </Button>
              <Badge variant="outline" className={`font-mono text-xs ${inZone ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40' : 'border-amber-600 text-amber-300'}`}>
                {inZone ? tc('mg.FaderRideGame.in_zone', '(IN ZONE)') : tc('mg.FaderRideGame.out', '(OUT)')}
              </Badge>
            </div>
          </div>

          {/* Run countdown: the take scores itself at zero */}
          <div className="space-y-1" data-testid="fader-run-progress">
            <div className="flex justify-between text-xs font-mono text-stone-300">
              <span>{gameOver ? 'Take printed' : 'Auto-scores when the tape stops'}</span>
              <span className="text-emerald-300 font-bold">{timeLeft}s</span>
            </div>
            <Progress value={progress} className="h-2 bg-stone-800" aria-label="Run progress" />
          </div>

          {/* Analog Console Channel Strip & Precision Meter Interface */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-950/80 p-4 rounded-xl border-2 border-stone-800 shadow-inner">
            {/* Left: Input & Target Visualizer */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1">Incoming Lead Track</div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-stone-300">{tc('mg.FaderRideGame.track_title', 'Track: {{value}}', { value: trackLevel.toFixed(1) })}</span>
                  <span className="text-sky-400">{trackLevel >= 70 ? 'LOUD' : trackLevel <= 30 ? 'QUIET' : 'MED'}</span>
                </div>
                <Progress value={trackLevel} className="h-2 bg-stone-800" />
              </div>

              {/* Status meter summary */}
              <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Target Level:</span>
                  <span className="text-emerald-400 font-bold">{tc('mg.FaderRideGame.green_zone', 'Green zone 40-60')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Print Level:</span>
                  <span className={inZone ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {output.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800">
                  <span>{tc('mg.FaderRideGame.in_zone_ticks', 'In-zone ticks: {{in}}/{{total}}', { in: inZoneTicks, total: totalTicks })}</span>
                </div>
              </div>

              {/* No-clip status badge */}
              <div className={`text-xs font-bold p-2 rounded border ${
                noClip 
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' 
                  : 'bg-red-950/40 border-red-700/60 text-red-300 animate-pulse'
              }`}>
                {noClip
                  ? tc('mg.FaderRideGame.no_clip', '🔇 No-clip streak intact! +10% bonus applied.')
                  : tc('mg.FaderRideGame.clipped', '⚠️ Clipped! Output exceeded {{level}} (peak {{peak}}). Bonus lost.', { level: CLIP_LEVEL, peak: maxOutput.toFixed(1) })}
              </div>
            </div>

            {/* Center: Vertical LED PPM Ladder Meter */}
            <div className="flex flex-col items-center justify-between bg-stone-900/90 p-3 rounded-lg border border-stone-800">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1">Output PPM</div>
              
              <div className="relative w-10 h-52 bg-black rounded-lg border border-stone-700 p-1 flex flex-col justify-end overflow-hidden">
                {/* Green Sweet Spot Highlight in background */}
                <div
                  className="absolute left-0 right-0 bg-emerald-500/25 border-y border-emerald-400/80 pointer-events-none z-10"
                  style={{
                    bottom: `${ZONE_LO}%`,
                    height: `${ZONE_HI - ZONE_LO}%`
                  }}
                />

                {/* 16-Segment LED Ladder Meter */}
                <div className="flex flex-col-reverse justify-between h-full w-full py-1">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const threshold = (i / 15) * 100;
                    const isActive = output >= threshold;
                    const isClip = threshold >= CLIP_LEVEL - 5;
                    const isGreen = threshold >= ZONE_LO && threshold <= ZONE_HI;

                    return (
                      <div
                        key={i}
                        className={`h-2 w-full rounded-sm transition-opacity duration-75 ${
                          isActive
                            ? isClip
                              ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                              : isGreen
                                ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                                : 'bg-amber-400'
                            : 'bg-stone-800/40'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="text-[10px] font-mono text-stone-400 mt-1">
                {output.toFixed(0)} dBFS
              </div>
            </div>

            {/* Right: Authentic Vertical Console Channel Fader */}
            <div className="flex flex-col items-center justify-between bg-stone-900/90 p-3 rounded-lg border border-stone-800">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1">
                {tc('mg.FaderRideGame.fader', 'Fader')}
              </div>

              {/* 100mm Vertical Fader Rail */}
              <div
                ref={faderTrackRef}
                className="relative w-14 h-52 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 rounded-lg border-2 border-stone-700 flex justify-center cursor-pointer select-none"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  setIsDraggingFader(true);
                  handleFaderPointer(e);
                }}
                onPointerMove={(e) => {
                  if (isDraggingFader) handleFaderPointer(e);
                }}
                onPointerUp={() => setIsDraggingFader(false)}
                onPointerCancel={() => setIsDraggingFader(false)}
              >
                {/* Metal Guide Slot */}
                <div className="w-1.5 h-full bg-black rounded-full border-x border-stone-700" />

                {/* Engraved dB Tick Marks */}
                <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between text-[8px] font-mono text-stone-500 pointer-events-none">
                  <span>+10</span>
                  <span>+5</span>
                  <span className="text-amber-300 font-bold">0</span>
                  <span>-5</span>
                  <span>-10</span>
                  <span>-20</span>
                  <span>-∞</span>
                </div>

                {/* Motorized Fader Knob Handle */}
                <div
                  className="absolute w-11 h-7 -translate-x-1/2 left-1/2 rounded bg-gradient-to-r from-stone-400 via-stone-200 to-stone-400 border border-white shadow-xl flex items-center justify-center transition-all duration-75 cursor-grab active:cursor-grabbing hover:brightness-110"
                  style={{
                    bottom: `calc(${fader}% - 14px)`,
                  }}
                >
                  {/* Center notch indicator line */}
                  <div className="w-8 h-0.5 bg-red-600 rounded" />
                </div>
              </div>

              {/* Fader Value readout & manual buttons */}
              <div className="flex items-center gap-1.5 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFaderChange(fader - 5)}
                  className="h-6 w-6 p-0 text-xs border-stone-700 text-stone-300"
                >
                  -
                </Button>
                <span className="font-mono text-xs font-bold text-amber-300 w-10 text-center">
                  {fader}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFaderChange(fader + 5)}
                  className="h-6 w-6 p-0 text-xs border-stone-700 text-stone-300"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {gameOver && (
            <div key={score} className={`mt-4 text-center text-xl font-bold text-emerald-400 ${score >= 600 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}>
              {tc('mg.FaderRideGame.times_up', "Time's Up! Final Score: {{score}}", { score })}
            </div>
          )}
        </CardContent>
      </MinigameChrome>

      <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
        <KenneyButton variant="green" onClick={onClose}>
          {tc('mg.FaderRideGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="green" onClick={finalize} disabled={gameOver || totalTicks === 0}>
          {tc('mg.FaderRideGame.finalize', 'Finish early (scores the full run)')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
