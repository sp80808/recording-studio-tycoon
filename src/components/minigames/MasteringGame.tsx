/**
 * @fileoverview Mastering Suite Minigame - Audio Mastering & Final Polish
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Interactive mastering rack with dynamic VU meters, stereo field goniometer,
 * real-time Web Audio limiter/compression/EQ/stereo widener processing,
 * and A/B master bypass auditioning.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
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
  Disc, 
  Sliders, 
  CheckCircle2 
} from 'lucide-react';
import { KenneyButton, MinigameChrome } from './MinigameChrome';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration, triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { tc } from '@/i18n/content';

interface MasteringGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

interface MasteringPreset {
  name: string;
  genre: string;
  volume: number;       // Target 0-100
  compression: number;  // Target 0-100
  eq: number;           // Target 0-100
  stereoWidth: number;  // Target 0-100
  targetLufs: string;
  targetGlue: string;
}

const PRESETS: MasteringPreset[] = [
  { name: "Rock Master", genre: "Rock", volume: 75, compression: 60, eq: 40, stereoWidth: 70, targetLufs: "-11 LUFS", targetGlue: "4.0 dB" },
  { name: "Pop Polish", genre: "Pop", volume: 65, compression: 45, eq: 60, stereoWidth: 50, targetLufs: "-13 LUFS", targetGlue: "3.0 dB" },
  { name: "Electronic Punch", genre: "Electronic", volume: 80, compression: 70, eq: 30, stereoWidth: 80, targetLufs: "-9 LUFS", targetGlue: "6.0 dB" },
  { name: "Acoustic Natural", genre: "Acoustic", volume: 55, compression: 25, eq: 70, stereoWidth: 30, targetLufs: "-16 LUFS", targetGlue: "1.5 dB" }
];

// Interactive Web Audio mastering processor
class MasterAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private stepInterval: NodeJS.Timeout | null = null;
  private step = 0;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  private panner: StereoPannerNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Audio Graph: Sources -> eqLow -> eqHigh -> compressor -> panner -> masterGain -> destination
      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = 'lowshelf';
      this.eqLow.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = 'highshelf';
      this.eqHigh.frequency.setValueAtTime(6000, this.ctx.currentTime);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);

      this.panner = this.ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(0, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.eqLow.connect(this.eqHigh);
      this.eqHigh.connect(this.compressor);
      this.compressor.connect(this.panner);
      this.panner.connect(this.masterGain);
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

  updateDSP(volume: number, compression: number, eq: number, width: number, bypass: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain || !this.compressor || !this.eqLow || !this.eqHigh) return;
    const now = this.ctx.currentTime;

    if (bypass) {
      this.masterGain.gain.setTargetAtTime(0.3, now, 0.05);
      this.compressor.threshold.setTargetAtTime(0, now, 0.05);
      this.eqLow.gain.setTargetAtTime(0, now, 0.05);
      this.eqHigh.gain.setTargetAtTime(0, now, 0.05);
      return;
    }

    // Volume & Limiter gain
    const outGain = 0.2 + (volume / 100) * 0.35;
    this.masterGain.gain.setTargetAtTime(outGain, now, 0.05);

    // Compression glue threshold (-6 to -32 dB)
    const threshold = -6 - (compression / 100) * 26;
    this.compressor.threshold.setTargetAtTime(threshold, now, 0.05);

    // EQ tilt (-6dB to +6dB)
    const lowGain = ((50 - eq) / 50) * 5;
    const highGain = ((eq - 50) / 50) * 6;
    this.eqLow.gain.setTargetAtTime(lowGain, now, 0.05);
    this.eqHigh.gain.setTargetAtTime(highGain, now, 0.05);
  }

  startBeat() {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;

    this.stepInterval = setInterval(() => {
      this.playMixStep();
    }, 175);
  }

  stopBeat() {
    this.isPlaying = false;
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  private playMixStep() {
    if (!this.ctx || !this.eqLow) return;
    const now = this.ctx.currentTime;
    const s = this.step % 8;
    this.step++;

    // Punchy electronic/rock master kick
    if (s === 0 || s === 4) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.eqLow);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // Snare / Rimshot
    if (s === 2 || s === 6) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.eqLow);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    // Bass synth tone
    if (s % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const notes = [110, 130.81, 146.83, 98];
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(notes[Math.floor(s / 2)], now);
      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      bassOsc.connect(bassGain);
      bassGain.connect(this.eqLow);
      bassOsc.start(now);
      bassOsc.stop(now + 0.17);
    }
  }

  dispose() {
    this.stopBeat();
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // Safe ignore
      }
      this.ctx = null;
    }
  }
}

export const MasteringGame: React.FC<MasteringGameProps> = ({ onComplete, onClose }) => {
  const [currentTarget, setCurrentTarget] = useState(0);
  const [parameters, setParameters] = useState({
    volume: [50],
    compression: [30],
    eq: [50],
    stereoWidth: [40]
  });

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(50);
  const [feedback, setFeedback] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBypass, setIsBypass] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MasterAudioEngine>(new MasterAudioEngine());

  const target = PRESETS[currentTarget];

  // Sync Audio DSP with current parameters
  useEffect(() => {
    engineRef.current.updateDSP(
      parameters.volume[0],
      parameters.compression[0],
      parameters.eq[0],
      parameters.stereoWidth[0],
      isBypass
    );
  }, [parameters, isBypass]);

  // Clean up audio engine on unmount
  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine.dispose();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate precision matching accuracy
  const calculateAccuracy = useCallback(() => {
    const volDiff = Math.abs(parameters.volume[0] - target.volume);
    const compDiff = Math.abs(parameters.compression[0] - target.compression);
    const eqDiff = Math.abs(parameters.eq[0] - target.eq);
    const widthDiff = Math.abs(parameters.stereoWidth[0] - target.stereoWidth);
    const totalDiff = volDiff + compDiff + eqDiff + widthDiff;
    const accuracy = Math.max(0, 100 - (totalDiff / 4));
    return Math.round(accuracy);
  }, [parameters, target]);

  const accuracy = calculateAccuracy();

  // Check target submission
  const checkTarget = () => {
    const points = Math.round(accuracy * 2.5);
    setScore(prev => prev + points);

    if (accuracy >= 85) {
      void gameAudio.playSuccess();
      triggerMilestoneCelebration();
      setFeedback(tc('mg.MasteringGame.fb_perfect', '🎯 Perfect Master! +{{points}}', { points }));
    } else if (accuracy >= 65) {
      void gameAudio.playGoodHit();
      setFeedback(tc('mg.MasteringGame.fb_good', '👍 Good work! +{{points}}', { points }));
    } else {
      void gameAudio.playTactileClick();
      setFeedback(tc('mg.MasteringGame.fb_needs', '🔧 Needs adjustment +{{points}}', { points }));
    }

    setTimeout(() => {
      setFeedback('');
      if (currentTarget < PRESETS.length - 1) {
        setCurrentTarget(prev => prev + 1);
        setParameters({
          volume: [50],
          compression: [30],
          eq: [50],
          stereoWidth: [40]
        });
      } else {
        handleComplete();
      }
    }, 1800);
  };

  const handleTogglePlay = () => {
    void gameAudio.playGearSwitch();
    setIsPlaying(prev => {
      const next = !prev;
      if (next) engineRef.current.startBeat();
      else engineRef.current.stopBeat();
      return next;
    });
  };

  const handleComplete = () => {
    const finalScore = score + (accuracy >= 80 ? 150 : 0) + timeLeft * 2;
    onComplete(finalScore);
  };

  // Draw Stereo Goniometer / Vectorscope Canvas Display
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Dark oscilloscope display background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Goniometer grid lines (+45° and -45° crosshair)
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Polar circles
    [25, 50, 75].forEach(r => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Dynamic Lissajous Stereo Pattern based on Stereo Width & Playback
    const widthFactor = (parameters.stereoWidth[0] / 100);
    const energy = isPlaying ? 1 : 0.4;
    const pointsCount = 40;

    ctx.save();
    ctx.strokeStyle = isBypass ? '#a1a1aa' : '#38bdf8';
    ctx.shadowColor = isBypass ? '#71717a' : '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2;
      const radius = 55 * energy + Math.sin(angle * 3) * 12;
      const xOffset = Math.cos(angle) * radius * widthFactor;
      const yOffset = Math.sin(angle) * radius * (1.1 - widthFactor * 0.3);

      const px = centerX + xOffset;
      const py = centerY + yOffset;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Channel label indicators
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('L', 10, centerY - 4);
    ctx.fillText('R', width - 18, centerY - 4);
    ctx.fillText('M', centerX - 4, 14);
    ctx.fillText('S', centerX - 4, height - 6);

  }, [parameters.stereoWidth, isPlaying, isBypass]);

  // Sweet spot check
  const isVolInZone = Math.abs(parameters.volume[0] - target.volume) <= 6;
  const isCompInZone = Math.abs(parameters.compression[0] - target.compression) <= 6;
  const isEqInZone = Math.abs(parameters.eq[0] - target.eq) <= 6;
  const isWidthInZone = Math.abs(parameters.stereoWidth[0] - target.stereoWidth) <= 6;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.MasteringGame.title', '🎚️ Mastering Challenge')}
        score={score}
        timeLeft={timeLeft}
        accent="yellow"
      >
        <CardContent className="space-y-4 pt-1">
          {/* Header guidance */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            <div>
              <p className="text-amber-200 text-sm font-medium">
                {tc('mg.MasteringGame.instructions', 'Master the track to match the target sound!')}
              </p>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                {tc('mg.MasteringGame.target_name', 'Target: {{name}}', { name: tc(`mg.MasteringGame.preset_${currentTarget}`, target.name) })}
                <span className="text-stone-400 font-normal ml-2 font-mono">({target.targetLufs} • {target.targetGlue} Glue)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/70 text-amber-300 font-mono text-xs bg-amber-950/40">
                Preset {currentTarget + 1} / {PRESETS.length}
              </Badge>
              <Badge className="bg-yellow-500 text-black font-bold font-mono text-xs">
                {tc('mg.MasteringGame.accuracy', 'Accuracy: {{n}}%', { n: accuracy })}
              </Badge>
            </div>
          </div>

          {/* Oscilloscope Vectorscope & Dual VU Meter Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Goniometer Vectorscope */}
            <div className="relative rounded-xl border border-stone-700 bg-black p-2 flex flex-col items-center justify-center">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1">Stereo Goniometer</div>
              <canvas ref={canvasRef} width={220} height={150} className="w-full h-auto" />
            </div>

            {/* Dual Precision VU Meters */}
            <div className="md:col-span-2 rounded-xl border border-stone-700 bg-stone-950 p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2">
                <span>Integrated Loudness (LUFS)</span>
                <span>Analog Peak Meter</span>
              </div>

              {/* VU meter bars */}
              <div className="space-y-3">
                {/* Left/Loudness Channel */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-stone-300 mb-1">
                    <span>Loudness LUFS: <strong className={isVolInZone ? 'text-emerald-400' : 'text-amber-300'}>{(-24 + (parameters.volume[0] / 100) * 16).toFixed(1)} LUFS</strong></span>
                    <span className="text-stone-500">Target: {target.targetLufs}</span>
                  </div>
                  <div className="relative h-4 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                    {/* Sweet spot window */}
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400"
                      style={{ left: `${Math.max(0, target.volume - 6)}%`, width: '12%' }}
                    />
                    <div
                      className={`h-full transition-all duration-100 ${
                        isVolInZone ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'
                      }`}
                      style={{ width: `${parameters.volume[0]}%` }}
                    />
                  </div>
                </div>

                {/* Compression Glue Reduction Channel */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-stone-300 mb-1">
                    <span>Glue Reduction: <strong className={isCompInZone ? 'text-emerald-400' : 'text-amber-300'}>{((parameters.compression[0] / 100) * 8).toFixed(1)} dB</strong></span>
                    <span className="text-stone-500">Target: {target.targetGlue}</span>
                  </div>
                  <div className="relative h-4 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400"
                      style={{ left: `${Math.max(0, target.compression - 6)}%`, width: '12%' }}
                    />
                    <div
                      className={`h-full transition-all duration-100 ${
                        isCompInZone ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'
                      }`}
                      style={{ width: `${parameters.compression[0]}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Module Status Indicators */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] font-mono text-center">
                <span className={`p-1 rounded ${isVolInZone ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-stone-900 text-stone-400'}`}>
                  CEIL {isVolInZone ? '✓' : '...'}
                </span>
                <span className={`p-1 rounded ${isCompInZone ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-stone-900 text-stone-400'}`}>
                  GLUE {isCompInZone ? '✓' : '...'}
                </span>
                <span className={`p-1 rounded ${isEqInZone ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-stone-900 text-stone-400'}`}>
                  TONE {isEqInZone ? '✓' : '...'}
                </span>
                <span className={`p-1 rounded ${isWidthInZone ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-stone-900 text-stone-400'}`}>
                  WIDE {isWidthInZone ? '✓' : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Mastering Hardware Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-800/60 p-4 rounded-xl border border-stone-700">
            {/* 1. Volume / Ceiling */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-white font-semibold text-xs flex items-center gap-1.5">
                  {tc('mg.MasteringGame.volume', '🔊 Volume')}
                </label>
                <span className="text-stone-300 font-mono text-xs">{parameters.volume[0]}%</span>
              </div>
              <Slider
                value={parameters.volume}
                onValueChange={(value) => {
                  setParameters(prev => ({ ...prev, volume: value }));
                  void gameAudio.playSliderMove();
                }}
                max={100}
                step={1}
                className="w-full"
              />
              <div className={`text-[11px] font-mono mt-1 ${isVolInZone ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                {isVolInZone ? '✓ Locked in target zone' : tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.volume })}
              </div>
            </div>

            {/* 2. Compression Glue */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-white font-semibold text-xs flex items-center gap-1.5">
                  {tc('mg.MasteringGame.compression', '🗜️ Compression')}
                </label>
                <span className="text-stone-300 font-mono text-xs">{parameters.compression[0]}%</span>
              </div>
              <Slider
                value={parameters.compression}
                onValueChange={(value) => {
                  setParameters(prev => ({ ...prev, compression: value }));
                  void gameAudio.playSliderMove();
                }}
                max={100}
                step={1}
                className="w-full"
              />
              <div className={`text-[11px] font-mono mt-1 ${isCompInZone ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                {isCompInZone ? '✓ Locked in target zone' : tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.compression })}
              </div>
            </div>

            {/* 3. Master EQ Tilt */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-white font-semibold text-xs flex items-center gap-1.5">
                  {tc('mg.MasteringGame.eq', '🎛️ EQ')}
                </label>
                <span className="text-stone-300 font-mono text-xs">{parameters.eq[0]}%</span>
              </div>
              <Slider
                value={parameters.eq}
                onValueChange={(value) => {
                  setParameters(prev => ({ ...prev, eq: value }));
                  void gameAudio.playSliderMove();
                }}
                max={100}
                step={1}
                className="w-full"
              />
              <div className={`text-[11px] font-mono mt-1 ${isEqInZone ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                {isEqInZone ? '✓ Locked in target zone' : tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.eq })}
              </div>
            </div>

            {/* 4. Stereo Width */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-white font-semibold text-xs flex items-center gap-1.5">
                  {tc('mg.MasteringGame.stereo_width', '📻 Stereo Width')}
                </label>
                <span className="text-stone-300 font-mono text-xs">{parameters.stereoWidth[0]}%</span>
              </div>
              <Slider
                value={parameters.stereoWidth}
                onValueChange={(value) => {
                  setParameters(prev => ({ ...prev, stereoWidth: value }));
                  void gameAudio.playSliderMove();
                }}
                max={100}
                step={1}
                className="w-full"
              />
              <div className={`text-[11px] font-mono mt-1 ${isWidthInZone ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                {isWidthInZone ? '✓ Locked in target zone' : tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.stereoWidth })}
              </div>
            </div>
          </div>

          {/* Transport & DSP Bypass Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex gap-2">
              <Button
                onClick={handleTogglePlay}
                variant="outline"
                size="sm"
                className={`font-semibold border-amber-500 ${
                  isPlaying 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'text-amber-200 hover:bg-amber-900/40'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                {isPlaying ? 'Pause Track' : 'Play Master Audio'}
              </Button>

              <Button
                onClick={() => {
                  void gameAudio.playTactileClick();
                  setIsBypass(prev => !prev);
                }}
                variant={isBypass ? 'default' : 'outline'}
                size="sm"
                className={isBypass 
                  ? 'bg-rose-600 text-white font-bold' 
                  : 'border-stone-600 text-stone-300 hover:bg-stone-800'}
              >
                <Activity className="w-4 h-4 mr-1.5" />
                {isBypass ? 'DSP BYPASSED (RAW)' : 'MASTER ACTIVE (A/B)'}
              </Button>
            </div>

            <KenneyButton variant="green" onClick={checkTarget}>
              {tc('mg.MasteringGame.check', '✨ Check Master')}
            </KenneyButton>
          </div>

          {/* Live Feedback */}
          {feedback && (
            <div className="text-center text-sm font-bold text-yellow-300 animate-pulse pt-1">
              {feedback}
            </div>
          )}
        </CardContent>
      </MinigameChrome>

      <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
        <KenneyButton variant="grey" onClick={onClose}>
          {tc('mg.MasteringGame.cancel', 'Cancel')}
        </KenneyButton>
        <KenneyButton variant="yellow" onClick={handleComplete}>
          {tc('mg.MasteringGame.finish_early', 'Finish Early')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
