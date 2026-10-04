/**
 * @fileoverview Vocal Tuning Minigame - Digital Era (Auto-Tune / Melodyne)
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Interactive vocal pitch correction studio simulating a graphical pitch editor.
 * Players snap off-pitch vocal takes onto target note lanes, audition formants,
 * and play back the tuned vocal line in harmony.
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
  RotateCcw, 
  Sparkles, 
  Wand2, 
  Music2, 
  Volume2, 
  CheckCircle2, 
  Sliders 
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

interface PitchLane {
  note: string;
  midi: number;
  freq: number;
}

const SCALE_LANES: PitchLane[] = [
  { note: 'C5', midi: 72, freq: 523.25 },
  { note: 'B4', midi: 71, freq: 493.88 },
  { note: 'A4', midi: 69, freq: 440.00 },
  { note: 'G4', midi: 67, freq: 392.00 },
  { note: 'F4', midi: 65, freq: 349.23 },
  { note: 'E4', midi: 64, freq: 329.63 },
  { note: 'D4', midi: 62, freq: 293.66 },
  { note: 'C4', midi: 60, freq: 261.63 },
];

interface VocalNoteNode {
  id: number;
  word: string;
  targetMidi: number;
  currentMidi: number;
  startCents: number; // Initial deviation (-60 to +60 cents)
  currentCents: number; // Player's current offset
  isCorrected: boolean;
  timeIndex: number;
}

// Lightweight Web Audio vocal formant synthesizer
class VocalSynth {
  private ctx: AudioContext | null = null;
  private isMuted = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playVocalNote(freq: number, duration = 0.28, isTuned = false) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const formant1 = this.ctx.createBiquadFilter();
      const formant2 = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Vocal 'Ah' formant filters
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(800, now);
      formant1.Q.setValueAtTime(4.5, now);

      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1250, now);
      formant2.Q.setValueAtTime(5.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(formant1);
      osc.connect(formant2);
      formant1.connect(gain);
      formant2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);

      // Sweet harmonic chime if perfectly in tune
      if (isTuned) {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq * 2, now);
        chimeGain.gain.setValueAtTime(0.08, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chime.start(now);
        chime.stop(now + duration);
      }
    } catch {
      // Audio fallback
    }
  }

  playSnapChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio fallback
    }
  }
}

const vocalAudio = new VocalSynth();

export const VocalTuningGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(40);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadIndex, setPlayheadIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [tuneSpeed, setTuneSpeed] = useState<number>(50); // 0 = Natural, 100 = Hard Snap

  // 6 distinct vocal lyric nodes with melodic targets
  const [nodes, setNodes] = useState<VocalNoteNode[]>([
    { id: 1, word: 'Deep', targetMidi: 60, currentMidi: 60, startCents: 45, currentCents: 45, isCorrected: false, timeIndex: 0 },
    { id: 2, word: 'In', targetMidi: 64, currentMidi: 64, startCents: -50, currentCents: -50, isCorrected: false, timeIndex: 1 },
    { id: 3, word: 'The', targetMidi: 67, currentMidi: 67, startCents: 40, currentCents: 40, isCorrected: false, timeIndex: 2 },
    { id: 4, word: 'Groove', targetMidi: 69, currentMidi: 69, startCents: -55, currentCents: -55, isCorrected: false, timeIndex: 3 },
    { id: 5, word: 'All', targetMidi: 67, currentMidi: 67, startCents: 35, currentCents: 35, isCorrected: false, timeIndex: 4 },
    { id: 6, word: 'Night', targetMidi: 72, currentMidi: 72, startCents: -45, currentCents: -45, isCorrected: false, timeIndex: 5 },
  ]);

  // Derived stats
  const correctedCount = nodes.filter(n => Math.abs(n.currentCents) <= 12).length;
  const accuracyPercent = Math.round((correctedCount / nodes.length) * 100);

  // Timer countdown
  useEffect(() => {
    if (gameOver || timeLeft <= 0) {
      if (!gameOver) handleFinalize();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  // Playhead melody playback
  useEffect(() => {
    if (!isPlaying) {
      setPlayheadIndex(null);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= nodes.length) {
        setIsPlaying(false);
        setPlayheadIndex(null);
        clearInterval(interval);
        return;
      }

      setPlayheadIndex(currentIndex);
      const note = nodes[currentIndex];
      const lane = SCALE_LANES.find(l => l.midi === note.targetMidi);
      if (lane) {
        // Frequency with current detune cents
        const detunedFreq = lane.freq * Math.pow(2, note.currentCents / 1200);
        vocalAudio.playVocalNote(detunedFreq, 0.32, Math.abs(note.currentCents) <= 12);
      }
      currentIndex++;
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, nodes]);

  // Nudge cents up or down or snap to target
  const adjustCents = (id: number, delta: number) => {
    if (gameOver) return;

    setNodes(prev =>
      prev.map(node => {
        if (node.id !== id) return node;

        const nextCents = Math.max(-60, Math.min(60, node.currentCents + delta));
        const snapped = Math.abs(nextCents) <= 8 ? 0 : nextCents;
        const isTuned = Math.abs(snapped) <= 12;

        const lane = SCALE_LANES.find(l => l.midi === node.targetMidi);
        if (lane) {
          const freq = lane.freq * Math.pow(2, snapped / 1200);
          vocalAudio.playVocalNote(freq, 0.22, isTuned);
        }

        if (isTuned && !node.isCorrected) {
          void gameAudio.playGoodHit();
          setScore(s => s + 150);
          setFeedback(`✨ "${node.word}" pitch locked! +150 pts`);
          setTimeout(() => setFeedback(''), 1800);
        } else {
          void gameAudio.playTactileClick();
        }

        return {
          ...node,
          currentCents: snapped,
          isCorrected: isTuned,
        };
      })
    );
  };

  // Instant snap single node
  const snapNode = (id: number) => {
    if (gameOver) return;
    vocalAudio.playSnapChime();
    void gameAudio.playGoodHit();

    setNodes(prev =>
      prev.map(node => {
        if (node.id !== id) return node;
        const lane = SCALE_LANES.find(l => l.midi === node.targetMidi);
        if (lane) {
          vocalAudio.playVocalNote(lane.freq, 0.3, true);
        }
        return {
          ...node,
          currentCents: 0,
          isCorrected: true,
        };
      })
    );

    setScore(s => s + 120);
    setFeedback(`🎯 Auto-Tuned to pitch! +120 pts`);
    setTimeout(() => setFeedback(''), 1800);
  };

  // Auto-tune all remaining notes using Auto-Tune processor
  const handleAutoTuneAll = () => {
    if (gameOver) return;
    vocalAudio.playSnapChime();
    void gameAudio.playSuccess();

    setNodes(prev =>
      prev.map(node => {
        const lane = SCALE_LANES.find(l => l.midi === node.targetMidi);
        if (lane) {
          vocalAudio.playVocalNote(lane.freq, 0.35, true);
        }
        return {
          ...node,
          currentCents: 0,
          isCorrected: true,
        };
      })
    );

    triggerMilestoneCelebration();
    setScore(s => s + 250);
    setFeedback('🚀 Melody fully Auto-Tuned in harmony!');
    setTimeout(() => setFeedback(''), 2200);
  };

  const handlePlayPreview = () => {
    void gameAudio.playGearSwitch();
    setIsPlaying(p => !p);
  };

  const handleReset = () => {
    void gameAudio.playTactileClick();
    setIsPlaying(false);
    setNodes([
      { id: 1, word: 'Deep', targetMidi: 60, currentMidi: 60, startCents: 45, currentCents: 45, isCorrected: false, timeIndex: 0 },
      { id: 2, word: 'In', targetMidi: 64, currentMidi: 64, startCents: -50, currentCents: -50, isCorrected: false, timeIndex: 1 },
      { id: 3, word: 'The', targetMidi: 67, currentMidi: 67, startCents: 40, currentCents: 40, isCorrected: false, timeIndex: 2 },
      { id: 4, word: 'Groove', targetMidi: 69, currentMidi: 69, startCents: -55, currentCents: -55, isCorrected: false, timeIndex: 3 },
      { id: 5, word: 'All', targetMidi: 67, currentMidi: 67, startCents: 35, currentCents: 35, isCorrected: false, timeIndex: 4 },
      { id: 6, word: 'Night', targetMidi: 72, currentMidi: 72, startCents: -45, currentCents: -45, isCorrected: false, timeIndex: 5 },
    ]);
    setScore(0);
    setFeedback('');
  };

  const handleFinalize = () => {
    setGameOver(true);
    const finalScore = score + (correctedCount === nodes.length ? 200 : 0) + timeLeft * 2;
    const isSuccess = correctedCount >= 4 || finalScore >= 500;
    if (isSuccess) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }
    onComplete(finalScore, isSuccess);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.VocalTuningGame.title', '🎤 Vocal Tuning Challenge')}
        score={score}
        timeLeft={gameOver ? undefined : timeLeft}
        accent="red"
      >
        <CardContent className="space-y-4 pt-1">
          {/* Header instructions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            <div>
              <p className="text-amber-200 text-sm font-medium">
                Snap vocal takes onto the musical note grid to fix flat (♭) and sharp (♯) deviations!
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Adjust cents with sliders or click 🎯 Snap to lock pitch. Press ▶ Play to audition the melody!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600/70 text-emerald-300 font-mono text-xs bg-emerald-950/40">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {correctedCount} / {nodes.length} Tuned
              </Badge>
              <Badge className="bg-red-600/90 text-white font-mono text-xs">
                {accuracyPercent}% Pitch
              </Badge>
            </div>
          </div>

          {/* Graphical Vocal Pitch Correction Roll */}
          <div className="relative rounded-xl border-2 border-stone-700 bg-stone-950 p-3 overflow-hidden shadow-inner">
            {/* Piano roll pitch lanes background */}
            <div className="space-y-1 mb-2">
              {SCALE_LANES.map(lane => (
                <div 
                  key={lane.midi}
                  className="flex items-center gap-2 h-7 rounded px-2 bg-stone-900/50 border border-stone-800/70"
                >
                  <span className="w-8 font-mono text-[10px] font-bold text-stone-400">
                    {lane.note}
                  </span>
                  <div className="flex-1 h-[1px] bg-stone-800" />
                  <span className="text-[9px] font-mono text-stone-500">{lane.freq}Hz</span>
                </div>
              ))}
            </div>

            {/* Vocal Note Nodes along the timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
              {nodes.map((node, index) => {
                const isTuned = Math.abs(node.currentCents) <= 12;
                const isCurrentPlayhead = playheadIndex === index;
                const targetNoteName = SCALE_LANES.find(l => l.midi === node.targetMidi)?.note || 'C4';

                return (
                  <div
                    key={node.id}
                    className={`relative rounded-lg p-2.5 border transition-all duration-200 flex flex-col justify-between ${
                      isCurrentPlayhead
                        ? 'ring-2 ring-yellow-400 bg-amber-950/60 border-yellow-500 scale-105'
                        : isTuned
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-stone-900 border-stone-700 text-stone-200'
                    }`}
                  >
                    {/* Word label & pitch target */}
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs truncate">"{node.word}"</span>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] px-1 py-0 font-mono ${
                          isTuned ? 'border-emerald-400 text-emerald-300' : 'border-stone-600 text-stone-400'
                        }`}
                      >
                        {targetNoteName}
                      </Badge>
                    </div>

                    {/* Detune Cent Display & Visual Pitch Indicator */}
                    <div className="my-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span 
                          className={`font-mono text-xs font-bold ${
                            isTuned 
                              ? 'text-emerald-400' 
                              : node.currentCents > 0 
                                ? 'text-amber-400' 
                                : 'text-sky-400'
                          }`}
                        >
                          {node.currentCents === 0 ? '0¢ (PERFECT)' : `${node.currentCents > 0 ? '+' : ''}${node.currentCents}¢`}
                        </span>
                      </div>

                      {/* Visual Pitch Error Deviation Bar */}
                      <div className="relative w-full h-1.5 bg-stone-800 rounded-full mt-1.5 overflow-hidden">
                        {/* Center Target Detent */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400 -translate-x-1/2 z-10" />
                        {/* Needle */}
                        <div
                          className={`absolute top-0 bottom-0 w-2 rounded-full -translate-x-1/2 transition-all ${
                            isTuned ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-red-400'
                          }`}
                          style={{ left: `${Math.max(5, Math.min(95, ((node.currentCents + 60) / 120) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Tuning controls */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1 justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustCents(node.id, -15)}
                          className="h-6 w-7 p-0 text-xs border-stone-600 text-stone-300 hover:bg-stone-800"
                        >
                          ♭
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustCents(node.id, +15)}
                          className="h-6 w-7 p-0 text-xs border-stone-600 text-stone-300 hover:bg-stone-800"
                        >
                          ♯
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => snapNode(node.id)}
                          className={`h-6 text-[10px] px-1.5 font-bold ${
                            isTuned 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                              : 'bg-amber-600 text-black hover:bg-amber-500'
                          }`}
                        >
                          Snap
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Playback preview & reset */}
            <div className="flex gap-2">
              <Button
                onClick={handlePlayPreview}
                variant="outline"
                size="sm"
                className={`border-amber-500 font-semibold ${
                  isPlaying 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'text-amber-200 hover:bg-amber-900/40'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                {isPlaying ? 'Pause Melody' : 'Play Melody Preview'}
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

            {/* Quick Auto-Tune DSP button */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAutoTuneAll}
                size="sm"
                className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold shadow-lg"
              >
                <Wand2 className="w-4 h-4 mr-1.5" />
                Auto-Tune All (Cher Effect)
              </Button>
            </div>
          </div>

          {/* Progress & Live Feedback */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-stone-400 font-mono">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Music2 className="w-3.5 h-3.5 text-amber-400" />
                Vocal Harmony Accuracy
              </span>
              <span>{accuracyPercent}% In Tune</span>
            </div>
            <Progress value={accuracyPercent} className="h-2 bg-stone-800" />

            {feedback && (
              <div className="text-center text-sm font-bold text-yellow-300 animate-pulse pt-1">
                {feedback}
              </div>
            )}

            {gameOver && (
              <div className="text-center text-lg font-bold text-emerald-400 pt-2">
                {tc('mg.VocalTuningGame.times_up', "Time's Up! Final Score: {{score}}", { score })}
              </div>
            )}
          </div>
        </CardContent>
      </MinigameChrome>

      <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
        <KenneyButton variant="red" onClick={onClose}>
          {tc('mg.VocalTuningGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="red" onClick={handleFinalize} disabled={gameOver}>
          {tc('mg.VocalTuningGame.finalize', 'Finalize & Get Score')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
