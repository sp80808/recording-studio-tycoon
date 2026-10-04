/**
 * @fileoverview Live Recording Coordination Minigame - Studio Producer Directing
 * @version 0.4.0
 * @author Recording Studio Tycoon Development Team
 * 
 * Interactive live room tracking simulation.
 * Players direct a live trio (Drums, Bass, Guitar), coaching timing drift,
 * calling groove cues in sync with the beat, and driving the session into a legendary take.
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
  Sparkles, 
  Users, 
  Mic2, 
  Flame, 
  CheckCircle2, 
  Zap, 
  Radio 
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

interface MusicianFigure {
  id: string;
  instrument: string;
  icon: string;
  position: { x: number; y: number };
  isPerformingWell: boolean;
  pocketMeter: number; // 0 to 100%
  coachCooldown: boolean;
}

// Live band Web Audio synthesizer
class LiveBandSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private beat = 0;
  private masterGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
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

  startSession(getBandState: () => { drums: boolean; bass: boolean; guitar: boolean }) {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this.beat = 0;

    this.loopInterval = setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const b = this.beat % 8;
      this.beat++;
      const state = getBandState();

      // 1. Drummer track
      if (state.drums) {
        if (b === 0 || b === 4) {
          // Kick
          const kick = this.ctx.createOscillator();
          const kGain = this.ctx.createGain();
          kick.frequency.setValueAtTime(130, now);
          kick.frequency.exponentialRampToValueAtTime(40, now + 0.1);
          kGain.gain.setValueAtTime(0.5, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          kick.connect(kGain);
          kGain.connect(this.masterGain);
          kick.start(now);
          kick.stop(now + 0.13);
        }
        if (b === 2 || b === 6) {
          // Snare
          const snare = this.ctx.createOscillator();
          const sGain = this.ctx.createGain();
          snare.type = 'triangle';
          snare.frequency.setValueAtTime(200, now);
          sGain.gain.setValueAtTime(0.3, now);
          sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          snare.connect(sGain);
          sGain.connect(this.masterGain);
          snare.start(now);
          snare.stop(now + 0.09);
        }
      }

      // 2. Bassist track
      if (state.bass && b % 2 === 0) {
        const bassNotes = [110, 130.81, 146.83, 164.81];
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(bassNotes[(b / 2) % bassNotes.length], now);
        bGain.gain.setValueAtTime(0.18, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        bass.connect(bGain);
        bGain.connect(this.masterGain);
        bass.start(now);
        bass.stop(now + 0.16);
      }

      // 3. Guitarist track
      if (state.guitar && (b === 1 || b === 3 || b === 5 || b === 7)) {
        const gOsc = this.ctx.createOscillator();
        const gGain = this.ctx.createGain();
        gOsc.type = 'square';
        gOsc.frequency.setValueAtTime(330, now);
        gGain.gain.setValueAtTime(0.12, now);
        gGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        gOsc.connect(gGain);
        gGain.connect(this.masterGain);
        gOsc.start(now);
        gOsc.stop(now + 0.08);
      }

    }, 180);
  }

  stopSession() {
    this.isPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  dispose() {
    this.stopSession();
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

export const LiveRecordingGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(40);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [combo, setCombo] = useState(1);
  const [sessionEnergy, setSessionEnergy] = useState(70);

  const [musicians, setMusicians] = useState<MusicianFigure[]>([
    { id: 'drummer', instrument: 'Drums 🥁', icon: '🥁', position: { x: 50, y: 28 }, isPerformingWell: true, pocketMeter: 85, coachCooldown: false },
    { id: 'guitarist', instrument: 'Guitar 🎸', icon: '🎸', position: { x: 25, y: 65 }, isPerformingWell: true, pocketMeter: 90, coachCooldown: false },
    { id: 'bassist', instrument: 'Bass 🎻', icon: '🎻', position: { x: 75, y: 65 }, isPerformingWell: true, pocketMeter: 80, coachCooldown: false },
  ]);

  const musiciansRef = useRef(musicians);
  musiciansRef.current = musicians;

  const synthRef = useRef<LiveBandSynth>(new LiveBandSynth());

  // Start live band audio
  useEffect(() => {
    synthRef.current.startSession(() => {
      const cur = musiciansRef.current;
      return {
        drums: cur.find(m => m.id === 'drummer')?.isPerformingWell ?? true,
        bass: cur.find(m => m.id === 'bassist')?.isPerformingWell ?? true,
        guitar: cur.find(m => m.id === 'guitarist')?.isPerformingWell ?? true,
      };
    });

    return () => {
      synthRef.current.dispose();
    };
  }, []);

  // Main game timer & dynamic musician drift
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      setGameOver(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);

      // Random performance drift (chance a musician rushes/drags)
      if (Math.random() < 0.25 && !eventMessage) {
        setMusicians(prev => {
          const randomIndex = Math.floor(Math.random() * prev.length);
          const targetMusician = prev[randomIndex];
          if (!targetMusician.isPerformingWell) return prev;

          const updated = prev.map((m, i) =>
            i === randomIndex ? { ...m, isPerformingWell: false, pocketMeter: Math.max(20, m.pocketMeter - 40) } : m
          );

          setEventMessage(
            tc('mg.LiveRecordingGame.struggling', '{{instrument}} is struggling! Click to coach.', {
              instrument: tc(`mg.LiveRecordingGame.instrument_${targetMusician.id}`, targetMusician.instrument)
            })
          );

          void gameAudio.playError();
          return updated;
        });

        setTimeout(() => setEventMessage(null), 3500);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver, eventMessage]);

  // Handle Coaching Click
  const handleMusicianClick = (musicianId: string) => {
    if (gameOver) return;

    setMusicians(prev =>
      prev.map(m => {
        if (m.id === musicianId) {
          const wasStruggling = !m.isPerformingWell;
          void gameAudio.playGoodHit();

          if (wasStruggling) {
            const points = 80 * combo;
            setScore(s => s + points);
            setCombo(c => Math.min(3, c + 0.5));
            setSessionEnergy(e => Math.min(100, e + 12));
            setEventMessage(null);
          } else {
            setScore(s => s + 20);
          }

          return {
            ...m,
            isPerformingWell: true,
            pocketMeter: Math.min(100, m.pocketMeter + 35),
          };
        }
        return m;
      })
    );
  };

  // Groove cue pulse (keeps band locked)
  const handleGrooveCue = () => {
    if (gameOver) return;
    void gameAudio.playTactileClick();

    setMusicians(prev =>
      prev.map(m => ({
        ...m,
        pocketMeter: Math.min(100, m.pocketMeter + 10),
      }))
    );

    setScore(s => s + 30 * combo);
    setSessionEnergy(e => Math.min(100, e + 5));
  };

  // Periodic score accumulation for in-pocket band
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      const wellCount = musicians.filter(m => m.isPerformingWell).length;
      let tickPoints = wellCount * 6 * combo;

      if (wellCount === 3) {
        tickPoints += 10; // Trio synergy bonus
      }

      setScore(s => Math.max(0, s + tickPoints));
    }, 1000);

    return () => clearInterval(interval);
  }, [musicians, gameOver, combo]);

  const handleFinalize = () => {
    setGameOver(true);
    const finalScore = score + (sessionEnergy >= 80 ? 150 : 0);
    const isSuccess = score >= 300 || sessionEnergy >= 65;
    if (isSuccess) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }
    onComplete(finalScore, isSuccess);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl">
      <MinigameChrome
        title={tc('mg.LiveRecordingGame.title', '🎙️ Live Recording Coordination')}
        score={score}
        timeLeft={gameOver ? undefined : timeLeft}
        accent="red"
      >
        <CardContent className="space-y-4 pt-1">
          {/* Header guidance */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-stone-800/80 p-3 rounded-lg border border-stone-700">
            <div>
              <p className="text-amber-200 text-sm font-medium">
                {tc('mg.LiveRecordingGame.instructions', "Manage the band's performance. Click struggling musicians to coach them and maintain studio groove!")}
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Keep all 3 in the pocket. Tap Groove Cue to lock the tempo and build energy!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-red-500/70 text-red-300 font-mono text-xs bg-red-950/40">
                <Flame className="w-3.5 h-3.5 mr-1 text-red-400" />
                {combo.toFixed(1)}x COMBO
              </Badge>
              <Badge className="bg-amber-500 text-black font-bold font-mono text-xs">
                Energy: {sessionEnergy}%
              </Badge>
            </div>
          </div>

          {eventMessage && (
            <div className="p-2 text-center bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/50 animate-pulse font-bold text-sm">
              {eventMessage}
            </div>
          )}

          {/* Acoustic Live Room Tracking Floor */}
          <div className="relative h-72 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 rounded-xl p-4 border-2 border-stone-700 overflow-hidden shadow-inner">
            {/* Live Studio Parquet Floor Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Live Room Ambient Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Mic2 className="w-3.5 h-3.5" />
                Live Room A • 3 Track Roll
              </span>
              <span>All Mics Live (15 IPS)</span>
            </div>

            {/* Musicians on Stage */}
            {musicians.map((musician) => {
              const isWell = musician.isPerformingWell;
              return (
                <div
                  key={musician.id}
                  className={`absolute p-3 rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl select-none ${
                    isWell
                      ? 'bg-gradient-to-b from-emerald-800 to-emerald-950 border-2 border-emerald-400 hover:scale-105 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                      : 'bg-gradient-to-b from-red-800 to-red-950 border-2 border-red-400 animate-pulse hover:scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  }`}
                  style={{
                    left: `${musician.position.x}%`,
                    top: `${musician.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '130px',
                  }}
                  onClick={() => handleMusicianClick(musician.id)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-1 filter drop-shadow">
                      {musician.icon}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {tc(`mg.LiveRecordingGame.instrument_${musician.id}`, musician.instrument).split(' ')[0]}
                    </div>

                    {/* Pocket Status Badge */}
                    <div className={`text-[10px] uppercase font-bold mt-1.5 px-2 py-0.5 rounded-full ${
                      isWell 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' 
                        : 'bg-red-950 text-red-200 border border-red-500'
                    }`}>
                      {isWell ? tc('mg.LiveRecordingGame.in_pocket', 'In Pocket') : tc('mg.LiveRecordingGame.needs_coach', 'Needs Coach!')}
                    </div>

                    {/* Pocket Meter Progress Bar */}
                    <div className="w-full bg-stone-900 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${isWell ? 'bg-emerald-400' : 'bg-red-400'}`}
                        style={{ width: `${musician.pocketMeter}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Producer Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex gap-2">
              <Button
                onClick={handleGrooveCue}
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-black font-bold shadow-md"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Cue Groove Pulse
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <span>Band Synergy:</span>
              <Progress value={sessionEnergy} className="w-32 h-2 bg-stone-800" />
              <span className="text-emerald-400 font-bold">{sessionEnergy}%</span>
            </div>
          </div>

          {gameOver && (
            <div className="mt-4 text-center">
              <div className={`text-xl font-bold text-emerald-400 ${score >= 300 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}>
                {tc('mg.LiveRecordingGame.session_ended', 'Session Ended! Final Score: {{score}}', { score })}
              </div>
            </div>
          )}
        </CardContent>
      </MinigameChrome>

      <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
        <KenneyButton variant="red" onClick={onClose}>
          {tc('mg.LiveRecordingGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="green" onClick={handleFinalize} disabled={gameOver}>
          {tc('mg.LiveRecordingGame.finalize', 'Finalize & Get Score')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
