import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration, triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { tc } from '@/i18n/content';
import { Check, CheckCircle2, Sparkles, SlidersHorizontal, Zap } from 'lucide-react';

interface InstrumentTrack {
  id: string;
  name: string;
  type: 'drum' | 'bass' | 'guitar' | 'keys' | 'vocal' | 'strings';
  icon: string;
  colorBorder: string;
  colorAccent: string;
  frequency: number; // Center frequency for conflict check
  timing: number; // -25 to +25 ms
  targetTiming: number;
  volume: number; // 0 to 100%
  targetVolume: number;
  pan: number; // -100 to +100
  targetPan: number;
  isActive: boolean;
  stageIndex: number; // 0: Foundation, 1: Harmonic Bed, 2: Top End & Vocals
}

interface InstrumentLayeringGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  genre?: string;
}

const VOL_TOLERANCE = 8;
const PAN_TOLERANCE = 15;
const TIMING_TOLERANCE = 4;

const formatPan = (val: number) => {
  if (val === 0) return 'C';
  return val < 0 ? `L${Math.abs(val)}` : `R${val}`;
};

const formatTiming = (val: number) => {
  if (val === 0) return '0ms';
  return `${val > 0 ? '+' : ''}${val}ms`;
};

interface RailSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  target: number;
  tolerance: number;
  displayValue: string;
  displayTarget: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RailSlider: React.FC<RailSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  target,
  tolerance,
  displayValue,
  displayTarget,
  onChange,
  disabled = false,
}) => {
  const range = max - min;
  const targetMinPct = Math.max(0, Math.min(100, ((target - tolerance - min) / range) * 100));
  const targetMaxPct = Math.max(0, Math.min(100, ((target + tolerance - min) / range) * 100));
  const targetWidthPct = Math.max(4, targetMaxPct - targetMinPct);
  const isInZone = Math.abs(value - target) <= tolerance;
  const valuePct = Math.max(0, Math.min(100, ((value - min) / range) * 100));

  const wasInZoneRef = useRef(isInZone);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    // Magnetic snap feel if dragging within 2 units of target
    const snapped = Math.abs(raw - target) <= 2 ? target : raw;
    const nowInZone = Math.abs(snapped - target) <= tolerance;
    if (nowInZone && !wasInZoneRef.current) {
      void gameAudio.playZoneEnter();
    } else {
      void gameAudio.playSliderMove();
    }
    wasInZoneRef.current = nowInZone;
    onChange(snapped);
  };

  return (
    <div className={`flex flex-col justify-center min-w-0 ${disabled ? 'opacity-35 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between text-[11px] mb-0.5 px-0.5">
        <span className="text-stone-400 font-mono truncate">
          {label}: <span className={isInZone ? 'text-emerald-300 font-bold' : 'text-stone-200'}>{displayValue}</span>
        </span>
        <span className={`font-mono text-[9px] ${isInZone ? 'text-emerald-400 font-bold' : 'text-stone-500'}`}>
          {isInZone ? '✓ Locked' : `🎯 ${displayTarget}`}
        </span>
      </div>

      <div className="relative h-4 flex items-center px-1">
        {/* Rail track */}
        <div className="relative w-full h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
          {/* Target sweet-spot band */}
          <div
            className={`absolute top-0 bottom-0 transition-all ${
              isInZone
                ? 'bg-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.7)] border-x border-emerald-300'
                : 'bg-emerald-500/25 border-x border-emerald-500/40'
            }`}
            style={{ left: `${targetMinPct}%`, width: `${targetWidthPct}%` }}
          />
          {/* Center detent notch if bipolar */}
          {min < 0 && (
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-stone-600"
              style={{ left: `${((-min) / range) * 100}%` }}
            />
          )}
        </div>

        {/* Custom thumb visual */}
        <div
          className={`pointer-events-none absolute w-3 h-3 rounded-full border transition-transform duration-75 -translate-x-1/2 ${
            isInZone
              ? 'bg-white border-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] ring-2 ring-emerald-400/40'
              : 'bg-stone-300 border-stone-500 shadow-sm'
          }`}
          style={{ left: `${valuePct}%` }}
        />

        {/* Interactive native range input on top */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          aria-label={`${label} ${displayValue}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize disabled:cursor-default"
        />
      </div>
    </div>
  );
};

export const InstrumentLayeringGame: React.FC<InstrumentLayeringGameProps> = ({
  onComplete,
  onClose,
  genre = 'rock',
}) => {
  const [tracks, setTracks] = useState<InstrumentTrack[]>([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [activeStage, setActiveStage] = useState(0); // 0: Foundation, 1: Harmonic Bed, 2: Top & Vocals

  const genreKey = ['rock', 'pop', 'electronic'].includes(genre.toLowerCase()) ? genre.toLowerCase() : 'rock';

  // Initialize tracks based on genre with 3 defined production stages
  const initializeTracks = useCallback(() => {
    const baseTracksMap: Record<string, InstrumentTrack[]> = {
      rock: [
        { id: 'drums', name: 'Drums', type: 'drum', icon: '🥁', colorBorder: 'border-l-rose-500', colorAccent: 'text-rose-400', frequency: 80, timing: 0, targetTiming: 0, volume: 80, targetVolume: 80, pan: 0, targetPan: 0, isActive: true, stageIndex: 0 },
        { id: 'bass', name: 'Bass Guitar', type: 'bass', icon: '🎸', colorBorder: 'border-l-sky-500', colorAccent: 'text-sky-400', frequency: 100, timing: 5, targetTiming: 4, volume: 70, targetVolume: 72, pan: -20, targetPan: 0, isActive: true, stageIndex: 0 },
        { id: 'rhythm', name: 'Rhythm Guitar', type: 'guitar', icon: '🎸', colorBorder: 'border-l-amber-500', colorAccent: 'text-amber-400', frequency: 400, timing: 0, targetTiming: 0, volume: 60, targetVolume: 62, pan: -40, targetPan: -40, isActive: false, stageIndex: 1 },
        { id: 'keys', name: 'Keys/Piano', type: 'keys', icon: '🎹', colorBorder: 'border-l-emerald-500', colorAccent: 'text-emerald-400', frequency: 500, timing: 0, targetTiming: 0, volume: 50, targetVolume: 52, pan: 20, targetPan: 25, isActive: false, stageIndex: 1 },
        { id: 'lead', name: 'Lead Guitar', type: 'guitar', icon: '🎸', colorBorder: 'border-l-yellow-500', colorAccent: 'text-yellow-400', frequency: 800, timing: -2, targetTiming: -2, volume: 65, targetVolume: 66, pan: 40, targetPan: 35, isActive: false, stageIndex: 2 },
        { id: 'vocal', name: 'Lead Vocal', type: 'vocal', icon: '🎤', colorBorder: 'border-l-purple-500', colorAccent: 'text-purple-400', frequency: 1000, timing: 0, targetTiming: 0, volume: 75, targetVolume: 82, pan: 0, targetPan: 0, isActive: false, stageIndex: 2 },
      ],
      pop: [
        { id: 'drums', name: 'Drums', type: 'drum', icon: '🥁', colorBorder: 'border-l-rose-500', colorAccent: 'text-rose-400', frequency: 80, timing: 0, targetTiming: 0, volume: 75, targetVolume: 76, pan: 0, targetPan: 0, isActive: true, stageIndex: 0 },
        { id: 'bass', name: 'Bass', type: 'bass', icon: '🎸', colorBorder: 'border-l-sky-500', colorAccent: 'text-sky-400', frequency: 120, timing: 0, targetTiming: 0, volume: 65, targetVolume: 68, pan: 0, targetPan: 0, isActive: true, stageIndex: 0 },
        { id: 'keys', name: 'Synth/Keys', type: 'keys', icon: '🎹', colorBorder: 'border-l-emerald-500', colorAccent: 'text-emerald-400', frequency: 600, timing: 0, targetTiming: 0, volume: 55, targetVolume: 56, pan: -30, targetPan: -30, isActive: false, stageIndex: 1 },
        { id: 'guitar', name: 'Electric Guitar', type: 'guitar', icon: '🎸', colorBorder: 'border-l-amber-500', colorAccent: 'text-amber-400', frequency: 800, timing: 0, targetTiming: 0, volume: 50, targetVolume: 52, pan: 30, targetPan: 30, isActive: false, stageIndex: 1 },
        { id: 'vocal', name: 'Lead Vocal', type: 'vocal', icon: '🎤', colorBorder: 'border-l-purple-500', colorAccent: 'text-purple-400', frequency: 1200, timing: 0, targetTiming: 0, volume: 85, targetVolume: 85, pan: 0, targetPan: 0, isActive: false, stageIndex: 2 },
        { id: 'harmony', name: 'Vocal Harmony', type: 'vocal', icon: '🎵', colorBorder: 'border-l-pink-500', colorAccent: 'text-pink-400', frequency: 1000, timing: 0, targetTiming: 2, volume: 45, targetVolume: 48, pan: -20, targetPan: -25, isActive: false, stageIndex: 2 },
      ],
      electronic: [
        { id: 'kick', name: 'Kick Drum', type: 'drum', icon: '🥁', colorBorder: 'border-l-rose-500', colorAccent: 'text-rose-400', frequency: 60, timing: 0, targetTiming: 0, volume: 85, targetVolume: 85, pan: 0, targetPan: 0, isActive: true, stageIndex: 0 },
        { id: 'bass', name: 'Synth Bass', type: 'bass', icon: '🎛️', colorBorder: 'border-l-sky-500', colorAccent: 'text-sky-400', frequency: 80, timing: 0, targetTiming: 0, volume: 80, targetVolume: 80, pan: 0, targetPan: 0, isActive: true, stageIndex: 0 },
        { id: 'pad', name: 'Synth Pad', type: 'strings', icon: '🌊', colorBorder: 'border-l-indigo-500', colorAccent: 'text-indigo-400', frequency: 400, timing: 10, targetTiming: 6, volume: 40, targetVolume: 44, pan: 0, targetPan: 0, isActive: false, stageIndex: 1 },
        { id: 'arp', name: 'Arpeggiator', type: 'keys', icon: '🔄', colorBorder: 'border-l-emerald-500', colorAccent: 'text-emerald-400', frequency: 800, timing: -5, targetTiming: -4, volume: 50, targetVolume: 52, pan: -40, targetPan: -35, isActive: false, stageIndex: 1 },
        { id: 'lead', name: 'Lead Synth', type: 'keys', icon: '🎹', colorBorder: 'border-l-yellow-500', colorAccent: 'text-yellow-400', frequency: 1000, timing: 0, targetTiming: 0, volume: 70, targetVolume: 70, pan: 20, targetPan: 25, isActive: false, stageIndex: 2 },
        { id: 'vocal', name: 'Vocal', type: 'vocal', icon: '🎤', colorBorder: 'border-l-purple-500', colorAccent: 'text-purple-400', frequency: 1200, timing: 0, targetTiming: 0, volume: 60, targetVolume: 65, pan: 0, targetPan: 0, isActive: false, stageIndex: 2 },
      ],
    };

    const genreTracks = baseTracksMap[genre.toLowerCase()] || baseTracksMap.rock;
    setTracks(genreTracks.map(track => ({ ...track })));
  }, [genre]);

  useEffect(() => {
    initializeTracks();
  }, [initializeTracks]);

  // Stage definitions for Guided Rails
  const STAGES = useMemo(() => [
    {
      index: 0,
      title: '1. Foundation',
      fullName: 'Stage 1: Rhythm Foundation',
      cue: genreKey === 'electronic'
        ? 'Anchor the heavy kick and sub-bass tight in the center.'
        : 'Lock in Drums & Bass down the center (Pan Center, Vol 70-80%).',
    },
    {
      index: 1,
      title: '2. Harmonic Bed',
      fullName: 'Stage 2: Harmonic Bed',
      cue: genreKey === 'electronic'
        ? 'Expand atmospheric pads and arpeggios wide for stereo depth.'
        : 'Spread rhythm guitars and keys wide into stereo channels.',
    },
    {
      index: 2,
      title: '3. Lead & Vocals',
      fullName: 'Stage 3: Lead & Focal Point',
      cue: genreKey === 'electronic'
        ? 'Balance the cutting lead synth and hook vocal right on top.'
        : 'Situate lead guitar in the pocket and place vocals front & center.',
    },
  ], [genreKey]);

  // Check if a track is in the pocket
  const isVolInZone = (t: InstrumentTrack) => Math.abs(t.volume - t.targetVolume) <= VOL_TOLERANCE;
  const isPanInZone = (t: InstrumentTrack) => Math.abs(t.pan - t.targetPan) <= PAN_TOLERANCE;
  const isTimingInZone = (t: InstrumentTrack) => Math.abs(t.timing - t.targetTiming) <= TIMING_TOLERANCE;
  const isTrackInPocket = (t: InstrumentTrack) => t.isActive && isVolInZone(t) && isPanInZone(t) && isTimingInZone(t);

  // Check if a stage is fully locked
  const isStageComplete = useCallback((stageIdx: number) => {
    const stageTracks = tracks.filter(t => t.stageIndex === stageIdx);
    return stageTracks.length > 0 && stageTracks.every(t => isTrackInPocket(t));
  }, [tracks]);

  // Live Score Calculation (0 to 150 scale)
  const calculateScore = useCallback(() => {
    const activeTracks = tracks.filter(t => t.isActive);
    if (activeTracks.length === 0) return 0;

    let points = 0;

    // 1. Foundation rule (up to 30 pts)
    const foundationTracks = tracks.filter(t => t.stageIndex === 0);
    const foundationActive = foundationTracks.every(t => t.isActive);
    if (foundationActive) points += 25;
    else if (foundationTracks.some(t => t.isActive)) points += 10;

    // 2. Stage progression bonuses (up to 35 pts)
    const harmonyActive = tracks.filter(t => t.stageIndex === 1 && t.isActive).length;
    const topActive = tracks.filter(t => t.stageIndex === 2 && t.isActive).length;
    points += harmonyActive * 8;
    points += topActive * 10;

    // 3. Pocket Precision (up to 45 pts)
    activeTracks.forEach(track => {
      let trackPoints = 0;
      if (isVolInZone(track)) trackPoints += 3;
      else if (Math.abs(track.volume - track.targetVolume) <= VOL_TOLERANCE * 2) trackPoints += 1.5;

      if (isPanInZone(track)) trackPoints += 2.5;
      else if (Math.abs(track.pan - track.targetPan) <= PAN_TOLERANCE * 2) trackPoints += 1;

      if (isTimingInZone(track)) trackPoints += 2;
      else if (Math.abs(track.timing - track.targetTiming) <= TIMING_TOLERANCE * 2) trackPoints += 1;

      points += trackPoints;
    });

    // 4. Frequency distribution (up to 20 pts)
    const frequencyGroups: Record<number, number> = {};
    activeTracks.forEach(track => {
      const freqGroup = Math.floor(track.frequency / 300);
      frequencyGroups[freqGroup] = (frequencyGroups[freqGroup] || 0) + 1;
    });
    const maxFreqConflicts = Math.max(0, ...Object.values(frequencyGroups));
    const freqScore = maxFreqConflicts > 2 ? Math.max(5, 20 - (maxFreqConflicts - 2) * 8) : 20;
    points += freqScore;

    // 5. Stereo spread (up to 20 pts)
    const hasLeft = activeTracks.some(t => t.pan < -15);
    const hasCenter = activeTracks.some(t => t.pan >= -15 && t.pan <= 15);
    const hasRight = activeTracks.some(t => t.pan > 15);
    let spreadScore = 0;
    if (hasCenter) spreadScore += 8;
    if (hasLeft) spreadScore += 6;
    if (hasRight) spreadScore += 6;
    points += spreadScore;

    return Math.min(150, Math.round(points));
  }, [tracks]);

  const currentScore = calculateScore();

  // Auto-advance stage when current stage completes
  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    if (isStageComplete(activeStage) && activeStage < 2) {
      const nextStage = activeStage + 1;
      setActiveStage(nextStage);
      void gameAudio.playZoneEnter();
    }
  }, [tracks, activeStage, gameStarted, gameCompleted, isStageComplete]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameCompleted(false);
    setScore(0);
    setTimeLeft(90);
    setActiveStage(0);

    void gameAudio.initialize();
  }, []);

  const endGame = useCallback(() => {
    if (gameCompleted) return;
    setGameCompleted(true);
    const finalScore = calculateScore();
    setScore(finalScore);

    if (finalScore >= 120) {
      void gameAudio.playPerfectMix();
      triggerMilestoneCelebration('S', 'Platinum');
    } else if (finalScore >= 80) {
      void gameAudio.playCompleteProject();
      triggerProjectCompleteJuice();
    } else {
      void gameAudio.playCompleteProject();
    }

    setTimeout(() => onComplete(finalScore), 1200);
  }, [gameCompleted, calculateScore, onComplete]);

  // Timer loop
  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted, endGame]);

  const toggleTrack = (trackId: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id !== trackId) return track;
      const willBeActive = !track.isActive;
      return {
        ...track,
        isActive: willBeActive,
        // When activating, place sliders close to target so it's ergonomic to dial in
        volume: willBeActive && track.volume === 0 ? track.targetVolume : track.volume,
      };
    }));
    void gameAudio.playClick();
  };

  const updateTrackParameter = (trackId: string, parameter: 'volume' | 'pan' | 'timing', value: number) => {
    setTracks(prev => prev.map(track => track.id === trackId ? { ...track, [parameter]: value } : track));
  };

  // On-rails quick snap to sweet spots
  const snapTrack = (trackId: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        isActive: true,
        volume: track.targetVolume,
        pan: track.targetPan,
        timing: track.targetTiming,
      };
    }));
    void gameAudio.playZoneEnter();
    void gameAudio.playTactileClick();
  };

  // Align the entire active stage
  const snapCurrentStage = () => {
    setTracks(prev => prev.map(track => {
      if (track.stageIndex !== activeStage) return track;
      return {
        ...track,
        isActive: true,
        volume: track.targetVolume,
        pan: track.targetPan,
        timing: track.targetTiming,
      };
    }));
    void gameAudio.playZoneEnter();
    void gameAudio.playTactileClick();
  };

  // Genre tips list for start screen
  const getGenreHints = () => {
    const hints: Record<string, string[]> = {
      rock: [
        '🥁 Drums and bass are essential foundation',
        '🎸 Layer rhythm guitar before lead',
        '🎤 Vocals should sit on top of the mix',
        '⚖️ Balance guitar frequencies to avoid mud',
      ],
      pop: [
        '🎤 Vocals are the star - make them prominent',
        '🎹 Synths/keys fill harmonic space nicely',
        '🎵 Vocal harmonies add richness',
        '📍 Keep rhythm section tight and punchy',
      ],
      electronic: [
        '🔊 Kick and bass form the foundation',
        '🌊 Pads create atmosphere behind the lead',
        '🔄 Arpeggios add movement and interest',
        '⚡ Layer synths carefully to avoid frequency buildup',
      ],
    };
    return (hints[genre.toLowerCase()] || hints.rock).map((h, i) => tc(`mg.InstrumentLayeringGame.hint_${genreKey}_${i + 1}`, h));
  };

  // 1. Ready / Start Screen
  if (!gameStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-stone-900 border-stone-700 text-white shadow-2xl overflow-hidden">
        <MinigameChrome
          title={tc('mg.InstrumentLayeringGame.title', '🎼 Instrument Layering Challenge')}
          accent="green"
          onClose={onClose}
        >
          <div className="p-5 space-y-4 text-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--rst-live)]">
                {tc('mg.InstrumentLayeringGame.genre_label', 'Genre:')} {genre.toUpperCase()}
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                {tc('mg.InstrumentLayeringGame.title', '🎼 Instrument Layering Challenge')}
              </h2>
              <p className="text-sm text-stone-300 mt-2 max-w-lg mx-auto leading-relaxed">
                {tc('mg.InstrumentLayeringGame.intro', 'Create the perfect {{genre}} arrangement! Layer instruments thoughtfully, balance frequencies, and achieve a professional mix.', { genre })}
              </p>
            </div>

            {/* 3 Guided Stages Preview */}
            <div className="grid grid-cols-3 gap-2.5 text-left bg-stone-950/70 border border-stone-800 p-3 rounded-lg">
              {STAGES.map((s) => (
                <div key={s.index} className="p-2 rounded bg-stone-900/60 border border-stone-800/80">
                  <div className="text-[11px] font-bold text-[var(--rst-brass-400)]">{s.title}</div>
                  <div className="text-[10px] text-stone-400 mt-1 leading-snug">{s.cue}</div>
                </div>
              ))}
            </div>

            <div className="text-xs text-[var(--rst-live)] bg-white/[0.04] border border-[var(--rst-line)] p-3 rounded-lg text-left space-y-1">
              <div className="font-semibold text-white mb-1">
                {tc('mg.InstrumentLayeringGame.tips_heading', '💡 {{genre}} Tips:', { genre: genre.charAt(0).toUpperCase() + genre.slice(1) })}
              </div>
              {getGenreHints().slice(0, 3).map((hint, idx) => (
                <div key={idx} className="text-stone-300">{hint}</div>
              ))}
            </div>

            <KenneyButton
              onClick={startGame}
              variant="green"
              className="text-base px-8 py-2.5 mt-2"
            >
              {tc('mg.InstrumentLayeringGame.start', 'Start Arranging')}
            </KenneyButton>
          </div>
        </MinigameChrome>
      </Card>
    );
  }

  // 2. Result Screen
  if (gameCompleted) {
    const lockedCount = tracks.filter(isTrackInPocket).length;
    return (
      <Card className="w-full max-w-2xl mx-auto bg-stone-900 border-stone-700 text-white shadow-2xl overflow-hidden">
        <MinigameChrome
          title={tc('mg.InstrumentLayeringGame.complete_title', '🎼 Arrangement Complete!')}
          score={score}
          accent="green"
          onClose={onClose}
        >
          <CardContent className="text-center space-y-4 py-6">
            <div className="space-y-2">
              <div className="text-sm text-stone-400">
                {tc('mg.InstrumentLayeringGame.result_line', 'Active Tracks: {{count}} | Genre: {{genre}}', { count: tracks.filter(t => t.isActive).length, genre })}
                <span className="mx-2 text-stone-600">·</span>
                <span className="text-emerald-400 font-semibold">{lockedCount} in pocket</span>
              </div>
              {score >= 120 && (
                <div className="text-emerald-400 font-bold text-2xl mg-perfect-pop">
                  {tc('mg.InstrumentLayeringGame.result_studio', '🎉 Studio-Quality Arrangement!')}
                </div>
              )}
              {score >= 80 && score < 120 && (
                <div className="text-[var(--rst-live)] font-bold text-xl mg-meter-glow">
                  {tc('mg.InstrumentLayeringGame.result_pro', '👍 Professional Layering!')}
                </div>
              )}
              {score < 80 && (
                <div className="text-amber-400 font-bold text-xl">
                  {tc('mg.InstrumentLayeringGame.result_good', '📈 Good Foundation!')}
                </div>
              )}
            </div>
          </CardContent>
        </MinigameChrome>
        <DialogFooter className="p-4 bg-stone-950/80 border-t border-stone-800">
          <KenneyButton variant="green" onClick={onClose}>
            {tc('mg.InstrumentLayeringGame.collect', 'Collect Rewards')}
          </KenneyButton>
        </DialogFooter>
      </Card>
    );
  }

  // Active track count
  const activeCount = tracks.filter(t => t.isActive).length;
  const lockedCount = tracks.filter(isTrackInPocket).length;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-stone-900 text-white border-stone-700 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
      <MinigameChrome
        title={tc('mg.InstrumentLayeringGame.title', '🎼 Instrument Layering Challenge')}
        score={currentScore}
        timeLeft={timeLeft}
        accent="green"
        onClose={onClose}
      >
        <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto">

          {/* ON-RAILS GUIDED STAGES STEPPER */}
          <div className="bg-stone-950/90 border border-stone-800 rounded-lg p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {STAGES.map((stage) => {
                  const complete = isStageComplete(stage.index);
                  const isCurrent = activeStage === stage.index;
                  return (
                    <button
                      key={stage.index}
                      type="button"
                      onClick={() => {
                        setActiveStage(stage.index);
                        void gameAudio.playTactileClick();
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                          : complete
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/40'
                          : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      ) : (
                        <span className={`w-3.5 h-3.5 rounded-full text-[10px] flex items-center justify-center font-mono ${
                          isCurrent ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {stage.index + 1}
                        </span>
                      )}
                      <span>{stage.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Align Stage assist button */}
              <button
                type="button"
                onClick={snapCurrentStage}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-600/40 hover:bg-amber-900/50 hover:text-white transition-colors"
                title="Automatically align and lock current stage channels"
              >
                <Zap size={12} className="text-amber-400" />
                <span>Align Stage</span>
              </button>
            </div>

            {/* Current Stage Coaching Cue */}
            <div className="flex items-center justify-between text-xs text-stone-300 px-1">
              <span className="truncate">
                <span className="text-[var(--rst-brass-400)] font-bold">{STAGES[activeStage].fullName}:</span>{' '}
                <span className="text-stone-300">{STAGES[activeStage].cue}</span>
              </span>
              <span className="shrink-0 ml-2 font-mono text-[11px] text-emerald-400 font-semibold">
                {lockedCount}/6 Locked
              </span>
            </div>
          </div>

          {/* TRACK HEADERS (DESKTOP) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-mono uppercase tracking-wider text-stone-400 px-3">
            <span className="col-span-3">Track / Instrument</span>
            <span className="col-span-3">Volume</span>
            <span className="col-span-3">Stereo Pan</span>
            <span className="col-span-2">Micro-Timing</span>
            <span className="col-span-1 text-right">Status</span>
          </div>

          {/* COMPACT CHANNEL RACK (6 ROWS) */}
          <div className="space-y-1.5">
            {tracks.map((track) => {
              const inPocket = isTrackInPocket(track);
              const isStageFocus = track.stageIndex === activeStage;

              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                    track.colorBorder
                  } border-l-4 ${
                    track.isActive
                      ? inPocket
                        ? 'bg-emerald-950/20 border-stone-700/80 border-l-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        : isStageFocus
                        ? 'bg-stone-900/95 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.15)]'
                        : 'bg-stone-900/80 border-stone-700/70'
                      : 'bg-stone-950/40 border-stone-800/50 opacity-60 hover:opacity-85'
                  }`}
                >
                  {/* Track Identity & Active Toggle */}
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTrack(track.id)}
                      className={`h-6 px-2 text-[10px] font-bold rounded transition-colors shrink-0 ${
                        track.isActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                      }`}
                    >
                      {track.isActive ? tc('mg.InstrumentLayeringGame.on', 'ON') : tc('mg.InstrumentLayeringGame.off', 'OFF')}
                    </button>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0" aria-hidden="true">{track.icon}</span>
                      <div className="flex flex-col min-w-0 truncate">
                        <span className="font-semibold text-xs text-white truncate">
                          {tc(`mg.InstrumentLayeringGame.track_${genreKey}_${track.id}`, track.name)}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono truncate">
                          {track.frequency}Hz · {tc(`mg.InstrumentLayeringGame.type_${track.type}`, track.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="sm:col-span-3">
                    <RailSlider
                      label={tc('mg.InstrumentLayeringGame.volume', 'Volume')}
                      value={track.volume}
                      min={0}
                      max={100}
                      step={1}
                      target={track.targetVolume}
                      tolerance={VOL_TOLERANCE}
                      displayValue={`${track.volume}%`}
                      displayTarget={`~${track.targetVolume}%`}
                      disabled={!track.isActive}
                      onChange={(v) => updateTrackParameter(track.id, 'volume', v)}
                    />
                  </div>

                  {/* Pan Slider */}
                  <div className="sm:col-span-3">
                    <RailSlider
                      label={tc('mg.InstrumentLayeringGame.pan', 'Pan')}
                      value={track.pan}
                      min={-100}
                      max={100}
                      step={5}
                      target={track.targetPan}
                      tolerance={PAN_TOLERANCE}
                      displayValue={formatPan(track.pan)}
                      displayTarget={formatPan(track.targetPan)}
                      disabled={!track.isActive}
                      onChange={(v) => updateTrackParameter(track.id, 'pan', v)}
                    />
                  </div>

                  {/* Timing Slider */}
                  <div className="sm:col-span-2">
                    <RailSlider
                      label={tc('mg.InstrumentLayeringGame.timing', 'Timing')}
                      value={track.timing}
                      min={-25}
                      max={25}
                      step={1}
                      target={track.targetTiming}
                      tolerance={TIMING_TOLERANCE}
                      displayValue={formatTiming(track.timing)}
                      displayTarget={formatTiming(track.targetTiming)}
                      disabled={!track.isActive}
                      onChange={(v) => updateTrackParameter(track.id, 'timing', v)}
                    />
                  </div>

                  {/* Status / Snap Button */}
                  <div className="sm:col-span-1 flex items-center justify-end">
                    {!track.isActive ? (
                      <span className="text-[10px] font-mono text-stone-500">MUTED</span>
                    ) : inPocket ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-1.5 py-0.5 rounded shadow-sm">
                        <Check size={11} />
                        <span>LOCKED</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => snapTrack(track.id)}
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 px-1.5 py-0.5 rounded transition-colors"
                        title="Snap into target sweet spot"
                      >
                        <Sparkles size={10} className="text-amber-400" />
                        <span>Snap</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* COMPACT MIX ANALYSIS HUD BAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-2.5 bg-stone-950/80 rounded-lg border border-stone-800 text-xs">
            {/* 1. Frequency Distribution */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-medium">
                <span>{tc('mg.InstrumentLayeringGame.freq_balance', 'Frequency Balance')}</span>
                <span className="text-[10px] text-stone-500 font-mono">Masking Check</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[
                  { label: 'Low', range: [60, 200] },
                  { label: 'Mid', range: [200, 800] },
                  { label: 'Hi-Mid', range: [800, 3000] },
                  { label: 'Air', range: [3000, 20000] },
                ].map((band) => {
                  const count = tracks.filter(t => t.isActive && t.frequency >= band.range[0] && t.frequency < band.range[1]).length;
                  const isCrowded = count > 2;
                  return (
                    <div
                      key={band.label}
                      className={`p-1 rounded text-center border ${
                        isCrowded
                          ? 'bg-red-950/40 border-red-800/60 text-red-300'
                          : count > 0
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-stone-900/60 border-stone-800 text-stone-500'
                      }`}
                    >
                      <div className="font-semibold truncate">{band.label}</div>
                      <div className="font-mono text-[9px]">{count} trk</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Stereo Spread */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-medium">
                <span>{tc('mg.InstrumentLayeringGame.stereo', 'Stereo Field')}</span>
                <span className="text-[10px] text-stone-500 font-mono">L · C · R</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="bg-stone-900/70 border border-stone-800 p-1 rounded text-center">
                  <span className="text-stone-400">{tc('mg.InstrumentLayeringGame.left', 'Left')}</span>
                  <div className="font-bold text-sky-400 font-mono">
                    {tracks.filter(t => t.isActive && t.pan < -15).length}
                  </div>
                </div>
                <div className="bg-stone-900/70 border border-stone-800 p-1 rounded text-center">
                  <span className="text-stone-400">{tc('mg.InstrumentLayeringGame.center', 'Center')}</span>
                  <div className="font-bold text-emerald-400 font-mono">
                    {tracks.filter(t => t.isActive && t.pan >= -15 && t.pan <= 15).length}
                  </div>
                </div>
                <div className="bg-stone-900/70 border border-stone-800 p-1 rounded text-center">
                  <span className="text-stone-400">{tc('mg.InstrumentLayeringGame.right', 'Right')}</span>
                  <div className="font-bold text-sky-400 font-mono">
                    {tracks.filter(t => t.isActive && t.pan > 15).length}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Arrangement Fidelity / Meter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-medium">
                <span>Mix Quality</span>
                <span className={`font-mono font-bold ${
                  currentScore >= 120 ? 'text-emerald-400' : currentScore >= 80 ? 'text-sky-400' : 'text-amber-400'
                }`}>
                  {currentScore} / 150 pts
                </span>
              </div>
              <div className="h-4 bg-stone-900 rounded-full border border-stone-800 overflow-hidden relative p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentScore >= 120
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                      : currentScore >= 80
                      ? 'bg-gradient-to-r from-sky-500 to-sky-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, (currentScore / 150) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 px-0.5">
                <span>Active: {activeCount}/6</span>
                <span className={currentScore >= 120 ? 'text-emerald-400 font-semibold' : ''}>
                  {currentScore >= 120 ? 'Studio Master Ready' : currentScore >= 80 ? 'Pro Mix' : 'Dialing In...'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </MinigameChrome>

      {/* DIALOG FOOTER */}
      <DialogFooter className="px-4 py-2.5 bg-stone-950/95 border-t border-stone-800 flex items-center justify-between">
        <KenneyButton variant="red" onClick={onClose}>
          {tc('mg.InstrumentLayeringGame.cancel', 'Cancel')}
        </KenneyButton>
        <KenneyButton
          variant={currentScore >= 120 ? 'green' : 'blue'}
          onClick={endGame}
          disabled={activeCount === 0}
        >
          {tc('mg.InstrumentLayeringGame.finish', 'Finish Arrangement')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
