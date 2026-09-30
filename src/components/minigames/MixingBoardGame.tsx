import React, { useEffect, useRef, useState } from 'react';
import { Check, SlidersHorizontal, Trophy } from 'lucide-react';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration, triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { KenneyButton, MinigameChrome } from './MinigameChrome';
import './mixing-board.css';

interface Track {
  name: string;
  target: number;
  level: number;
  color: string;
}

interface MixingBoardGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const ROUND_SECONDS = 15;
const inZone = (track: Track) => Math.abs(track.level - track.target) <= 7.5;

export const MixingBoardGame: React.FC<MixingBoardGameProps> = ({ onComplete, onClose }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const deadline = useRef(0);
  const collected = useRef(false);
  const correct = tracks.filter(inZone).length;
  // Preserve the original reward economy: a perfect four-channel mix earns 80.
  const score = correct * (correct === 4 ? 20 : correct >= 2 ? 10 : 5);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) setPhase('result');
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'result') {
      if (correct === 4) {
        gameAudio.playPerfectMix();
        triggerMilestoneCelebration('S', 'Platinum');
      } else if (correct >= 2) {
        gameAudio.playCompleteProject();
        triggerProjectCompleteJuice();
      } else {
        gameAudio.playCompleteProject();
      }
    }
  }, [phase, correct]);

  const startGame = () => {
    setTracks(['Drums', 'Bass', 'Vocals', 'Synths'].map((name, index) => ({
      name,
      target: Math.floor(Math.random() * 60) + 20,
      level: 50,
      color: ['#fbbf24', '#38bdf8', '#fb7185', '#a78bfa'][index],
    })));
    deadline.current = performance.now() + ROUND_SECONDS * 1000;
    setTimeLeft(ROUND_SECONDS);
    setPhase('playing');
    gameAudio.initialize();
  };

  const updateLevel = (index: number, value: number) => {
    if (phase !== 'playing') return;
    if (performance.now() >= deadline.current) {
      setTimeLeft(0);
      setPhase('result');
      return;
    }
    const previous = tracks[index];
    const next = { ...previous, level: Math.max(0, Math.min(100, Math.round(value))) };
    if (next.level === previous.level) return;
    if (inZone(next) && !inZone(previous)) {
      gameAudio.playZoneEnter();
      void gameAudio.playTactileClick(0.5);
    } else {
      gameAudio.playSliderMove();
    }
    setTracks(tracks.map((track, i) => i === index ? next : track));
  };

  const collectReward = () => {
    if (phase !== 'result' || collected.current) return;
    collected.current = true;
    void gameAudio.playTactileClick();
    onComplete(score);
  };

  return (
    <MinigameChrome title="Mixing desk" score={score} timeLeft={phase === 'playing' ? timeLeft : undefined} accent="blue">
      <div className="mixing-desk p-4 sm:p-6">
        {phase === 'ready' ? (
          <div className="mx-auto max-w-sm space-y-5 py-6 text-center">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-[var(--rst-live)]" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--rst-live)]">15 seconds · 4 channels</p>
              <h4 className="mt-2 text-2xl font-bold text-white">Find the sweet spot.</h4>
              <p className="mt-3 text-sm leading-relaxed text-stone-300">Slide every fader into its green target band. Balance all four channels for a perfect mix.</p>
            </div>
            <KenneyButton onClick={startGame}>Start mixing</KenneyButton>
            <p className="text-xs text-stone-400">Drag, touch, or use the arrow keys on a fader.</p>
            <button type="button" onClick={onClose} className="min-h-11 rounded px-4 text-sm text-stone-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">Back to studio</button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">{phase === 'result' ? 'Session complete' : 'Live balance'}</p>
                <p role="status" className="mt-1 text-sm font-semibold text-white">{correct === 4 ? 'All channels balanced' : `${correct} of 4 channels balanced`}</p>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {tracks.map(track => <span key={track.name} className={`h-2.5 w-5 rounded-sm transition-colors ${inZone(track) ? 'bg-emerald-400 shadow-[0_0_8px_#34d39966]' : 'bg-stone-700'}`} />)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tracks.map((track, index) => {
                const balanced = inZone(track);
                return (
                  <div key={track.name} className={`mixing-channel rounded-xl border p-3 ${balanced ? 'border-emerald-400/50 bg-emerald-950/30' : 'border-stone-700 bg-stone-900/80'}`} style={{ '--channel-color': track.color } as React.CSSProperties}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <label htmlFor={`mixing-fader-${index}`} className="text-sm font-bold text-white">{track.name}</label>
                      <span className="text-[10px] font-mono text-stone-500">0{index + 1}</span>
                    </div>
                    <div className="mixing-meter" aria-hidden="true">
                      <div className="mixing-meter-fill" style={{ height: `${track.level}%` }} />
                      <div className="mixing-target" style={{ bottom: `${track.target - 7.5}%`, height: '15%' }} />
                      <div className="mixing-needle" style={{ bottom: `${track.level}%` }} />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-1">
                      <span className="text-2xl font-bold tabular-nums text-white">{track.level}</span>
                      <span className="text-[10px] text-stone-400">LEVEL</span>
                    </div>
                    <input id={`mixing-fader-${index}`} type="range" min="0" max="100" step="1" value={track.level}
                      disabled={phase !== 'playing'} onChange={event => updateLevel(index, Number(event.target.value))}
                      aria-describedby={`mixing-target-${index}`} aria-valuetext={`${track.level}, ${balanced ? 'balanced' : track.level < track.target ? 'raise level' : 'lower level'}`}
                      className="mixing-fader" />
                    <p id={`mixing-target-${index}`} className="text-[11px] tabular-nums text-stone-400">Target {Math.ceil(track.target - 7.5)}–{Math.floor(track.target + 7.5)}</p>
                    <p key={String(balanced)} className={`mt-2 flex min-h-5 items-center gap-1 text-xs font-semibold ${balanced ? 'mg-perfect-pop text-emerald-300' : 'text-stone-300'}`}>
                      {balanced ? <><Check size={14} aria-hidden="true" /> Balanced</> : track.level < track.target ? '↑ Raise level' : '↓ Lower level'}
                    </p>
                  </div>
                );
              })}
            </div>
            {phase === 'result' ? (
              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-center" role="status">
                <Trophy className="mg-perfect-pop mx-auto mb-2 text-amber-300" aria-hidden="true" />
                <h4 className="text-xl font-bold text-white">{correct === 4 ? 'Perfect mix!' : 'Mix captured'}</h4>
                <p className="mb-3 mt-1 text-sm text-stone-300">{score} points · {correct === 4 ? 'Every channel in the sweet spot.' : `${correct} of 4 channels on target.`}</p>
                <KenneyButton variant="green" onClick={collectReward}>Collect rewards</KenneyButton>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-stone-400">{correct === 4 ? 'Perfect balance. Print your mix!' : 'Match the bands, then print your mix.'}</p>
                <KenneyButton variant={correct === 4 ? 'green' : 'blue'} onClick={() => setPhase('result')}>Print mix</KenneyButton>
              </div>
            )}
          </>
        )}
      </div>
    </MinigameChrome>
  );
};
