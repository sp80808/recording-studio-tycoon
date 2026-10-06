/**
 * @fileoverview EQ Match Minigame - Audio Engineering EQ Curve Matching
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Interactive parametric equalizer matching console.
 * Players listen to a reference track, inspect the target frequency spectrum,
 * drag 4 EQ band nodes (60Hz, 250Hz, 1kHz, 8kHz), and toggle A/B audio preview.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  Volume1, 
  SlidersHorizontal, 
  CheckCircle2, 
  Radio 
} from 'lucide-react';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration, triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { tc } from '@/i18n/content';
import { MinigameDebrief } from './MinigameDebrief';
import { debriefEQMatch } from '@/minigames/debriefs';

export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

interface EQBandConfig {
  id: string;
  name: string;
  freq: number;
  type: BiquadFilterType;
  xPct: number; // Position on spectrum graph (0 to 100)
}

const BANDS: EQBandConfig[] = [
  { id: '60Hz', name: 'Low Shelf (60Hz)', freq: 60, type: 'lowshelf', xPct: 15 },
  { id: '250Hz', name: 'Low Mid (250Hz)', freq: 250, type: 'peaking', xPct: 38 },
  { id: '1kHz', name: 'Mid Peak (1kHz)', freq: 1000, type: 'peaking', xPct: 62 },
  { id: '8kHz', name: 'High Shelf (8kHz)', freq: 8000, type: 'highshelf', xPct: 85 },
];

const MIN_DB = -12;
const MAX_DB = 12;

// Real-time Web Audio Parametric Equalizer synth & filter engine
class EQAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private currentStep = 0;
  private filters: BiquadFilterNode[] = [];
  private masterGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create chain of 4 Biquad filters
      this.filters = BANDS.map(band => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.setValueAtTime(band.freq, this.ctx!.currentTime);
        filter.gain.setValueAtTime(0, this.ctx!.currentTime);
        if (band.type === 'peaking') {
          filter.Q.setValueAtTime(1.4, this.ctx!.currentTime);
        }
        return filter;
      });

      // Wire filters in series: filter0 -> filter1 -> filter2 -> filter3 -> masterGain
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1]);
      }
      this.filters[this.filters.length - 1].connect(this.masterGain);
    } catch {
      // Audio fallback
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setFilterGains(gains: number[]) {
    this.init();
    if (!this.ctx || this.filters.length !== gains.length) return;
    const now = this.ctx.currentTime;
    gains.forEach((gain, i) => {
      this.filters[i].gain.setTargetAtTime(gain, now, 0.04);
    });
  }

  startGroove() {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    this.loopInterval = setInterval(() => {
      this.playBeatStep();
    }, 170);
  }

  stopGroove() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  private playBeatStep() {
    if (!this.ctx || this.filters.length === 0) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep % 8;
    this.currentStep++;

    // 1. Kick on steps 0 and 4
    if (step === 0 || step === 4) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
      kickGain.gain.setValueAtTime(0.5, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      kickOsc.connect(kickGain);
      kickGain.connect(this.filters[0]);
      kickOsc.start(now);
      kickOsc.stop(now + 0.15);
    }

    // 2. Snare on steps 2 and 6
    if (step === 2 || step === 6) {
      const snareOsc = this.ctx.createOscillator();
      const snareGain = this.ctx.createGain();
      snareOsc.type = 'triangle';
      snareOsc.frequency.setValueAtTime(180, now);
      snareGain.gain.setValueAtTime(0.3, now);
      snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      snareOsc.connect(snareGain);
      snareGain.connect(this.filters[0]);
      snareOsc.start(now);
      snareOsc.stop(now + 0.09);
    }

    // 3. Hi-Hat tick on every other step
    const hatSize = this.ctx.sampleRate * 0.025;
    const hatBuf = this.ctx.createBuffer(1, hatSize, this.ctx.sampleRate);
    const data = hatBuf.getChannelData(0);
    for (let i = 0; i < hatSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const hatSource = this.ctx.createBufferSource();
    hatSource.buffer = hatBuf;
    const hatGain = this.ctx.createGain();
    hatGain.gain.setValueAtTime(0.18, now);
    hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    hatSource.connect(hatGain);
    hatGain.connect(this.filters[0]);
    hatSource.start(now);
    hatSource.stop(now + 0.03);
  }

  dispose() {
    this.stopGroove();
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

export const EQMatchGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  // Preset Target EQ Curve (Warm Analog Polish: +4dB bass, -2dB low-mid, +1dB mid, +5dB air)
  const [targets, setTargets] = useState<number[]>([4, -2, 1, 5]);
  const [values, setValues] = useState<number[]>([0, 0, 0, 0]);
  const [timeLeft, setTimeLeft] = useState(40);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReferenceMode, setIsReferenceMode] = useState(false); // A/B Audition mode
  const [feedback, setFeedback] = useState<string>('');
  const [draggedBand, setDraggedBand] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EQAudioEngine>(new EQAudioEngine());

  // Setup random studio target curve on mount
  useEffect(() => {
    // Generate harmonious target EQ curves: e.g. Bass Boost, V-Shape, Warm Mid Scoop
    const targetPresets = [
      [5, -3, 0, 6],   // Modern Radio V-Shape
      [6, 2, -3, 4],   // Warm Vintage Tape
      [-4, 1, 4, 3],   // Vocal Forward Broadcast
      [4, -4, 2, 5],   // Punchy Club Master
    ];
    const picked = targetPresets[Math.floor(Math.random() * targetPresets.length)];
    setTargets(picked);
  }, []);

  // Sync EQ audio filters with current values or reference
  useEffect(() => {
    const activeGains = isReferenceMode ? targets : values;
    engineRef.current.setFilterGains(activeGains);
  }, [values, targets, isReferenceMode]);

  // Clean up audio engine on unmount
  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine.dispose();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      if (!gameOver) handleFinalize();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  // Accuracy calculation
  const bandDistances = BANDS.map((_, i) => Math.abs(targets[i] - values[i]));
  const totalDistance = bandDistances.reduce((a, b) => a + b, 0);
  const maxPossibleDist = (MAX_DB - MIN_DB) * BANDS.length;
  const matchPercent = Math.max(0, Math.round(100 - (totalDistance / maxPossibleDist) * 100));
  const score = Math.round(matchPercent * 10);
  const isGoodMatch = matchPercent >= 80;

  // Toggle playback
  const handleTogglePlay = () => {
    void gameAudio.playGearSwitch();
    setIsPlaying(prev => {
      const next = !prev;
      if (next) engineRef.current.startGroove();
      else engineRef.current.stopGroove();
      return next;
    });
  };

  // Adjust a specific EQ band
  const adjustBand = (index: number, delta: number) => {
    if (gameOver) return;
    void gameAudio.playSliderMove();
    setValues(prev => {
      const next = [...prev];
      next[index] = Math.min(MAX_DB, Math.max(MIN_DB, next[index] + delta));
      return next;
    });
  };

  // Draw parametric EQ spectrum canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;
    const dbToY = (db: number) => midY - (db / MAX_DB) * (height * 0.4);

    // 1. Clear spectrum display with sleek dark grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Frequency grid lines (20Hz, 100Hz, 1kHz, 10kHz)
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // dB gain grid lines (+12, +6, 0dB, -6, -12)
    const dBLabels = [12, 6, 0, -6, -12];
    dBLabels.forEach(db => {
      const y = dbToY(db);
      ctx.strokeStyle = db === 0 ? '#52525b' : '#18181b';
      ctx.lineWidth = db === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = '#71717a';
      ctx.font = '9px monospace';
      ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, 6, y - 3);
    });

    // 2. Draw Target EQ Curve (dashed gold/cyan line)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let x = 0; x <= width; x += 4) {
      // Interpolate curve based on target band values
      const y = calculateCurveY(x, targets, width, height);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw target marker dots
    BANDS.forEach((band, i) => {
      const x = (band.xPct / 100) * width;
      const y = dbToY(targets[i]);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Active Player EQ Curve (glowing phosphor emerald)
    const curveColor = isReferenceMode ? '#38bdf8' : '#22c55e';
    ctx.save();
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = curveColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 4) {
      const y = calculateCurveY(x, isReferenceMode ? targets : values, width, height);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw active interactive control nodes
    BANDS.forEach((band, i) => {
      const x = (band.xPct / 100) * width;
      const currentVal = isReferenceMode ? targets[i] : values[i];
      const y = dbToY(currentVal);
      const isLocked = Math.abs(targets[i] - values[i]) <= 1;

      // Outer glow circle
      ctx.fillStyle = isLocked ? '#4ade80' : '#facc15';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Band name below
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(band.id, x, height - 6);
    });

  }, [values, targets, isReferenceMode]);

  // Smooth spline calculation for EQ frequency curve
  const calculateCurveY = (x: number, gains: number[], width: number, height: number): number => {
    const midY = height / 2;
    let totalOffset = 0;

    BANDS.forEach((band, i) => {
      const nodeX = (band.xPct / 100) * width;
      const dist = Math.abs(x - nodeX);
      const spread = width * 0.22; // filter Q width
      const weight = Math.exp(-Math.pow(dist / spread, 2));
      totalOffset += gains[i] * weight;
    });

    return midY - (totalOffset / MAX_DB) * (height * 0.4);
  };

  // Canvas interaction: drag EQ nodes directly
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Find closest band
    let closestIndex = -1;
    let minDist = 40;
    BANDS.forEach((band, i) => {
      const nodeX = (band.xPct / 100) * canvas.width;
      const dist = Math.abs(clickX - nodeX);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex !== -1) {
      setDraggedBand(closestIndex);
      updateBandFromY(closestIndex, clickY, canvas.height);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedBand === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    updateBandFromY(draggedBand, curY, canvas.height);
  };

  const handleCanvasMouseUp = () => {
    if (draggedBand !== null) {
      setDraggedBand(null);
    }
  };

  const updateBandFromY = (bandIndex: number, y: number, height: number) => {
    const midY = height / 2;
    const rawDb = -((y - midY) / (height * 0.4)) * MAX_DB;
    const clampedDb = Math.round(Math.max(MIN_DB, Math.min(MAX_DB, rawDb)));

    setValues(prev => {
      const next = [...prev];
      next[bandIndex] = clampedDb;
      return next;
    });

    if (Math.abs(clampedDb - targets[bandIndex]) <= 1) {
      void gameAudio.playGoodHit();
    } else {
      void gameAudio.playSliderMove();
    }
  };

  const handleAutoMatch = () => {
    void gameAudio.playSuccess();
    setValues([...targets]);
    setFeedback('✨ All EQ bands perfectly matched to reference!');
    triggerMilestoneCelebration();
    setTimeout(() => setFeedback(''), 2200);
  };

  const handleReset = () => {
    void gameAudio.playTactileClick();
    setValues([0, 0, 0, 0]);
    setIsReferenceMode(false);
  };

  const handleFinalize = () => {
    setGameOver(true);
    const finalScore = score + (matchPercent >= 90 ? 150 : 0);
    const isSuccess = matchPercent >= 75;
    if (isSuccess) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }
    onComplete(finalScore, isSuccess);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.EQMatchGame.title', '🎚️ EQ Match Challenge')}
        score={score}
        timeLeft={gameOver ? undefined : timeLeft}
        accent="blue"
      >
        <CardContent className="space-y-4 pt-1">
          {/* Header guidance */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            <div>
              <p className="text-sky-200 text-sm font-medium">
                Match your active EQ curve (Green) to the reference target curve (Blue)!
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Drag nodes directly on the spectrum graph or use the gain controls below. Press A/B to audition!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-sky-500/70 text-sky-300 font-mono text-xs bg-sky-950/40">
                <Radio className="w-3.5 h-3.5 mr-1 text-sky-400" />
                {tc('mg.EQMatchGame.match_meter', 'Match Meter')}: {matchPercent}%
              </Badge>
              {matchPercent >= 90 && (
                <Badge className="bg-emerald-500 text-black font-bold text-xs animate-pulse">
                  MASTER MATCH
                </Badge>
              )}
            </div>
          </div>

          {/* Graphical Parametric EQ Spectrum Display */}
          <div className="relative rounded-xl border-2 border-stone-700 bg-black overflow-hidden shadow-inner select-none">
            <canvas
              ref={canvasRef}
              width={750}
              height={190}
              className="w-full cursor-pointer active:cursor-grabbing"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />

            {/* Live curve legend overlay */}
            <div className="absolute top-2 right-3 flex items-center gap-4 text-[10px] font-mono bg-stone-900/80 px-2.5 py-1 rounded border border-stone-700">
              <div className="flex items-center gap-1.5 text-sky-300">
                <span className="w-3 h-0.5 border-b-2 border-dashed border-sky-400" />
                Target Reference
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-3 h-0.5 bg-emerald-400" />
                Your Live EQ
              </div>
            </div>
          </div>

          {/* Interactive Rack EQ Bands */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BANDS.map((band, i) => {
              const isLocked = Math.abs(targets[i] - values[i]) <= 1;
              return (
                <div
                  key={band.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isLocked
                      ? 'bg-emerald-950/30 border-emerald-600/70 text-emerald-200'
                      : 'bg-stone-800/80 border-stone-700 text-stone-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{band.id}</span>
                    <span className={`font-mono text-[10px] ${isLocked ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                      {isLocked ? '✓ MATCH' : `Target: ${targets[i] > 0 ? '+' : ''}${targets[i]}dB`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between my-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={gameOver}
                      onClick={() => adjustBand(i, -1)}
                      className="h-6 w-7 p-0 text-xs border-stone-600 text-stone-300 hover:bg-stone-700"
                    >
                      -
                    </Button>
                    <span className="font-mono text-xs font-bold text-center w-14">
                      {values[i] > 0 ? `+${values[i]}` : values[i]} dB
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={gameOver}
                      onClick={() => adjustBand(i, 1)}
                      className="h-6 w-7 p-0 text-xs border-stone-600 text-stone-300 hover:bg-stone-700"
                    >
                      +
                    </Button>
                  </div>

                  <input
                    type="range"
                    min={MIN_DB}
                    max={MAX_DB}
                    step={1}
                    value={values[i]}
                    disabled={gameOver}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setValues(prev => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      });
                    }}
                    className="w-full accent-emerald-500 mt-1 cursor-pointer"
                    aria-label={tc('mg.EQMatchGame.band_gain', '{{band}} gain', { band: band.id })}
                  />
                </div>
              );
            })}
          </div>

          {/* Transport & A/B Reference Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex gap-2">
              <Button
                onClick={handleTogglePlay}
                variant="outline"
                size="sm"
                className={`font-semibold border-sky-500 ${
                  isPlaying 
                    ? 'bg-sky-500 text-black hover:bg-sky-400' 
                    : 'text-sky-200 hover:bg-sky-900/40'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                {isPlaying ? 'Pause Audio' : 'Play Live Mix'}
              </Button>

              <Button
                onClick={() => {
                  void gameAudio.playTactileClick();
                  setIsReferenceMode(prev => !prev);
                }}
                variant={isReferenceMode ? 'default' : 'outline'}
                size="sm"
                className={isReferenceMode 
                  ? 'bg-sky-600 text-white font-bold' 
                  : 'border-stone-600 text-stone-300 hover:bg-stone-800'}
              >
                <Volume2 className="w-4 h-4 mr-1.5" />
                {isReferenceMode ? 'Listening: TARGET (A)' : 'Audition: REFERENCE (B)'}
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-stone-600 text-stone-300 hover:bg-stone-800"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>

            <Button
              onClick={handleAutoMatch}
              size="sm"
              variant="outline"
              className="border-amber-600 text-amber-300 hover:bg-amber-900/40 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Auto-Tune Curve
            </Button>
          </div>

          {/* Progress & Live Feedback */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-stone-400 font-mono">
              <span className="flex items-center gap-1.5 text-sky-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                Frequency Spectrum Fit
              </span>
              <span>{matchPercent}% / 100%</span>
            </div>
            <Progress value={matchPercent} className="h-2 bg-stone-800" />

            {feedback && (
              <div className="text-center text-sm font-bold text-yellow-300 animate-pulse pt-1">
                {feedback}
              </div>
            )}

            {gameOver && (
              <div className="text-center pt-2">
                <div className="text-xl font-bold text-emerald-400">
                  {tc('mg.EQMatchGame.times_up', "Time's Up! Final Score: {{score}}", { score })}
                </div>
                <div className="mt-1 text-xs text-stone-300">
                  {tc('mg.EQMatchGame.hidden_targets', 'Hidden targets were:')}{' '}
                  {BANDS.map((b, i) => (
                    <span key={b.id} className="font-mono mx-1">
                      {b.id}: {targets[i] > 0 ? `+${targets[i]}` : targets[i]}dB
                    </span>
                  ))}
                </div>
                <MinigameDebrief lines={debriefEQMatch(targets, values)} />
              </div>
            )}
          </div>
        </CardContent>
      </MinigameChrome>

      <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
        <KenneyButton variant="blue" onClick={onClose}>
          {tc('mg.EQMatchGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="blue" onClick={handleFinalize} disabled={gameOver}>
          {tc('mg.EQMatchGame.finalize', 'Finalize & Get Score')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
