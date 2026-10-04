/**
 * @fileoverview Sound Wave Matching Minigame - Oscilloscope & Synth Waveform Sculpting
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Interactive oscilloscope minigame simulating modular synth waveform calibration.
 * Players sculpt and match waveform frequency, amplitude, and shape (Sine, Triangle, Square, Saw)
 * using direct canvas touch or precision dials, auditioning the real-time synth tone.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  Radio, 
  SlidersHorizontal,
  Wand2
} from 'lucide-react';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration, triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { tc } from '@/i18n/content';

interface SoundWaveGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

type WaveType = 'sine' | 'triangle' | 'square' | 'sawtooth';

interface WaveTarget {
  type: WaveType;
  frequency: number; // e.g. 2 to 6 cycles across width
  amplitude: number; // 20 to 80 px
}

// Lightweight Web Audio Oscillator for Live Waveform Audition
class WaveSynth {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private isMuted = false;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gain.connect(this.ctx.destination);

      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sine';
      this.osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.osc.connect(this.gain);
      this.osc.start();
    } catch {
      // Audio fallback
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  updateTone(type: WaveType, freqCycles: number, ampRatio: number, active: boolean) {
    this.init();
    if (!this.ctx || !this.osc || !this.gain) return;
    this.resume();

    const now = this.ctx.currentTime;
    if (!active || this.isMuted) {
      this.gain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }

    try {
      this.osc.type = type;
    } catch {
      // Safe fallback
    }

    // Map 2-8 cycles to musical pitches (130Hz to 520Hz)
    const audioFreq = 110 + freqCycles * 48;
    this.osc.frequency.setTargetAtTime(audioFreq, now, 0.03);

    // Map amplitude to volume
    const vol = Math.min(0.25, (ampRatio / 100) * 0.25);
    this.gain.gain.setTargetAtTime(vol, now, 0.03);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  dispose() {
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {
        // Safe
      }
      this.osc = null;
    }
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

export const SoundWaveGame: React.FC<SoundWaveGameProps> = ({
  onComplete,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<WaveSynth>(new WaveSynth());

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [gameActive, setGameActive] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Target Waveform
  const [target, setTarget] = useState<WaveTarget>({
    type: 'sine',
    frequency: 3,
    amplitude: 45,
  });

  // Player's Sculpted Waveform
  const [playerType, setPlayerType] = useState<WaveType>('sine');
  const [playerFreq, setPlayerFreq] = useState<number>(2); // 1.5 to 7.0 cycles
  const [playerAmp, setPlayerAmp] = useState<number>(30);  // 15 to 75 px
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  // Generate target wave for current level
  const generateTargetWave = useCallback(() => {
    const types: WaveType[] = ['sine', 'triangle', 'sawtooth', 'square'];
    const pickedType = types[Math.floor(Math.random() * Math.min(types.length, 1 + currentLevel))];
    const freq = Math.round((2.0 + Math.random() * 3.5) * 10) / 10;
    const amp = Math.round(30 + Math.random() * 35);

    setTarget({
      type: pickedType,
      frequency: freq,
      amplitude: amp,
    });
  }, [currentLevel]);

  // Clean up synth on unmount
  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      synth.dispose();
    };
  }, []);

  // Update live synth audio tone
  useEffect(() => {
    synthRef.current.updateTone(playerType, playerFreq, playerAmp, gameActive);
  }, [playerType, playerFreq, playerAmp, gameActive]);

  // Calculate live alignment accuracy between target and player wave
  const typeMatch = playerType === target.type;
  const freqDiff = Math.abs(playerFreq - target.frequency);
  const ampDiff = Math.abs(playerAmp - target.amplitude);

  const freqAccuracy = Math.max(0, 100 - (freqDiff / target.frequency) * 100);
  const ampAccuracy = Math.max(0, 100 - (ampDiff / target.amplitude) * 100);
  const rawAccuracy = (freqAccuracy * 0.45) + (ampAccuracy * 0.45) + (typeMatch ? 10 : 0);
  const accuracy = Math.round(rawAccuracy);
  const isSyncLocked = typeMatch && freqDiff <= 0.35 && ampDiff <= 6;

  // Start game loop
  const startGame = useCallback(() => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(35);
    setCurrentLevel(1);
    generateTargetWave();
  }, [generateTargetWave]);

  // Timer countdown
  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          setTimeout(() => onComplete(score), 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, score, onComplete]);

  // Handle successful match submission or auto-lock
  const handleLockMatch = useCallback(() => {
    if (!gameActive) return;
    const levelPoints = Math.round(accuracy * currentLevel * 1.5);
    setScore(prev => prev + levelPoints);

    if (accuracy >= 80) {
      void gameAudio.playWaveformMatch();
      void gameAudio.playSuccess();
      setFeedback(`🎯 Perfect Sync! +${levelPoints} pts`);
    } else {
      void gameAudio.playGoodHit();
      setFeedback(`👍 Wave Captured! +${levelPoints} pts`);
    }

    setTimeout(() => {
      setFeedback('');
      setCurrentLevel(l => l + 1);
      generateTargetWave();
    }, 1200);
  }, [gameActive, accuracy, currentLevel, generateTargetWave]);

  // Draw oscilloscope canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Dark phosphor cathode ray oscilloscope background
    ctx.fillStyle = '#05130b';
    ctx.fillRect(0, 0, width, height);

    // Phosphor green grid lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.lineWidth = 1;
    for (let x = 20; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center zero-voltage reference axis
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // 1. Draw Target Wave (Phosphor Green glowing curve)
    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    drawOscillatorPath(ctx, target.type, target.frequency, target.amplitude, width, centerY);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Player's Sculpted Wave (Vibrant Amber / Locked Emerald)
    const playerColor = isSyncLocked ? '#34d399' : '#f59e0b';
    ctx.save();
    ctx.strokeStyle = playerColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = isSyncLocked ? 14 : 6;
    drawOscillatorPath(ctx, playerType, playerFreq, playerAmp, width, centerY);
    ctx.stroke();
    ctx.restore();

  }, [target, playerType, playerFreq, playerAmp, isSyncLocked]);

  // Mathematical oscillator shape drawer
  const drawOscillatorPath = (
    ctx: CanvasRenderingContext2D,
    type: WaveType,
    freq: number,
    amp: number,
    width: number,
    centerY: number
  ) => {
    ctx.beginPath();
    const step = 2;

    for (let x = 0; x <= width; x += step) {
      const t = (x / width) * freq * Math.PI * 2;
      let val = 0;

      switch (type) {
        case 'sine':
          val = Math.sin(t);
          break;
        case 'triangle':
          val = (2 / Math.PI) * Math.asin(Math.sin(t));
          break;
        case 'square':
          val = Math.sign(Math.sin(t)) || 1;
          break;
        case 'sawtooth':
          val = 2 * ((t / (Math.PI * 2)) % 1) - 1;
          break;
      }

      const y = centerY - val * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };

  // Direct Interactive Canvas Ribbon Touch/Drag
  const handleCanvasPointer = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // X maps to frequency cycles (1.5 to 6.5)
    const newFreq = Math.round((1.5 + (x / rect.width) * 5.0) * 10) / 10;
    // Y distance from center maps to amplitude (15 to 70px)
    const distY = Math.abs(y - rect.height / 2);
    const newAmp = Math.round(Math.max(15, Math.min(70, distY * 1.1)));

    setPlayerFreq(newFreq);
    setPlayerAmp(newAmp);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.SoundWaveGame.title', '🌊 Sound Wave Matching')}
        score={score}
        timeLeft={gameActive ? timeLeft : undefined}
        streak={currentLevel >= 2 ? currentLevel : undefined}
        accent="green"
      >
        <CardContent className="space-y-3 pt-1">
          <div className="text-center text-xs text-stone-300">
            {tc('mg.SoundWaveGame.level_hint', 'Level {{level}} — draw the orange wave to match the green target!', { level: currentLevel })}
          </div>

          {!gameActive && timeLeft === 35 ? (
            <div className="text-center space-y-4 py-6 bg-stone-950/60 rounded-xl border border-stone-800">
              <p className="text-stone-300 text-sm max-w-md mx-auto">
                {tc('mg.SoundWaveGame.intro', 'Draw the orange wave to match the green target wave!')}
              </p>
              <p className="text-xs text-stone-400">
                Calibrate the oscillator type, frequency, and amplitude to lock the sound in phase.
              </p>
              <KenneyButton variant="green" onClick={startGame}>
                {tc('mg.SoundWaveGame.start', 'Start Wave Challenge')}
              </KenneyButton>
            </div>
          ) : !gameActive && timeLeft === 0 ? (
            <div key={score} className="space-y-3 py-6 text-center bg-stone-950/60 rounded-xl border border-stone-800">
              <div className={`text-xl font-bold text-yellow-400 ${score > 0 ? 'mg-perfect-pop' : ''}`}>
                {tc('mg.SoundWaveGame.complete', 'Challenge Complete!')}
              </div>
              <div className="text-sm font-mono text-stone-300">
                {tc('mg.SoundWaveGame.final_score', 'Final Score: {{score}}', { score })}
              </div>
              <KenneyButton variant="green" onClick={onClose}>
                {tc('mg.SoundWaveGame.collect', 'Collect Rewards')}
              </KenneyButton>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Cathode Ray Oscilloscope Display */}
              <div className="relative border-2 border-emerald-900/80 rounded-xl overflow-hidden shadow-inner bg-black select-none">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={170}
                  className="w-full cursor-crosshair active:brightness-110"
                  onMouseDown={(e) => {
                    setIsDraggingCanvas(true);
                    handleCanvasPointer(e);
                  }}
                  onMouseMove={(e) => {
                    if (isDraggingCanvas) handleCanvasPointer(e);
                  }}
                  onMouseUp={() => setIsDraggingCanvas(false)}
                  onMouseLeave={() => setIsDraggingCanvas(false)}
                />

                {/* Oscilloscope Header Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-600/70 text-emerald-400 bg-emerald-950/60">
                    Target: {target.type.toUpperCase()} ({target.frequency}x)
                  </Badge>
                  {isSyncLocked && (
                    <Badge className="bg-emerald-500 text-black font-bold text-[10px] animate-pulse">
                      PHASE LOCKED!
                    </Badge>
                  )}
                </div>

                {/* Accuracy HUD */}
                <div className="absolute top-2 right-2 text-right">
                  <span className={`text-xs font-mono font-bold ${isSyncLocked ? 'text-emerald-300' : 'text-amber-400'}`}>
                    Match: {accuracy}%
                  </span>
                </div>
              </div>

              {/* Waveform Shape Selector Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {(['sine', 'triangle', 'square', 'sawtooth'] as WaveType[]).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={playerType === type ? 'default' : 'outline'}
                    onClick={() => {
                      void gameAudio.playTactileClick();
                      setPlayerType(type);
                    }}
                    className={`h-7 text-xs capitalize ${
                      playerType === type 
                        ? 'bg-amber-600 text-black font-bold hover:bg-amber-500' 
                        : 'border-stone-700 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>

              {/* Interactive Precision Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-950/60 p-3 rounded-lg border border-stone-800 text-xs">
                {/* Frequency */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-stone-400">Frequency Cycles</span>
                    <span className="text-amber-300 font-bold">{playerFreq}x</span>
                  </div>
                  <Slider
                    min={1.5}
                    max={6.5}
                    step={0.1}
                    value={[playerFreq]}
                    onValueChange={([val]) => setPlayerFreq(val)}
                    className="w-full"
                  />
                </div>

                {/* Amplitude */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-stone-400">Amplitude Height</span>
                    <span className="text-amber-300 font-bold">{playerAmp}px</span>
                  </div>
                  <Slider
                    min={15}
                    max={70}
                    step={1}
                    value={[playerAmp]}
                    onValueChange={([val]) => setPlayerAmp(val)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Action Controls & Legend */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-4 text-xs font-mono text-stone-400">
                  <div className="flex items-center">
                    <div className="w-3.5 h-1 bg-emerald-500 mr-1.5 rounded-full" />
                    <span>{tc('mg.SoundWaveGame.target_wave', 'Target Wave')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3.5 h-1 bg-amber-500 mr-1.5 rounded-full" />
                    <span>{tc('mg.SoundWaveGame.your_wave', 'Your Wave')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <KenneyButton 
                    variant={isSyncLocked ? 'green' : 'yellow'} 
                    onClick={handleLockMatch}
                  >
                    {isSyncLocked ? '✨ Capture Wave' : 'Check Sync'}
                  </KenneyButton>
                </div>
              </div>

              {feedback && (
                <div className="text-center text-sm font-bold text-yellow-300 animate-pulse pt-1">
                  {feedback}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </MinigameChrome>
    </Card>
  );
};
