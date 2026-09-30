import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gameEvents, type GameEventPayloads } from '@/engine/gameEventBus';
import { gameAudio } from '@/utils/audioSystem';
import { triggerMilestoneCelebration } from '@/utils/confettiJuice';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import './chip-fidelity.css';

type Ceremony = GameEventPayloads['season:awards'];

const STATUS = {
  winner: { label: 'WINNER', tint: 'from-yellow-300 via-amber-400 to-yellow-600 text-black' },
  nominated: { label: 'NOMINATED', tint: 'from-stone-500 to-stone-700 text-white' },
  not_nominated: { label: 'NOT NOMINATED', tint: 'from-stone-600 to-stone-800 text-stone-300' },
} as const;

const STEP_MS = 3400;

/**
 * Annual Studio Awards ceremony. Same stamp-in reveal styling as the chart reveal;
 * plays each category with its criteria outcome, then the small rewards granted.
 * Enter / Space / click advances, Escape skips. Reduced motion: no confetti.
 */
export const SeasonAwardsCeremony: React.FC = () => {
  const { particles } = useMotionCapabilities();
  const [current, setCurrent] = useState<Ceremony | null>(null);
  const [step, setStep] = useState(0);
  const queue = useRef<Ceremony[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => gameEvents.on('season:awards', payload => {
    if (seen.current.has(payload.seasonId)) return; // a season's ceremony plays once
    seen.current.add(payload.seasonId);
    queue.current.push(payload);
    setCurrent(cur => cur ?? queue.current.shift() ?? null);
    setStep(0);
  }), []);

  const nextCeremony = useCallback(() => { setCurrent(queue.current.shift() ?? null); setStep(0); }, []);
  const total = current ? current.awards.length + 1 : 0; // one per award, then the rewards card
  const advance = useCallback(() => setStep(s => (s + 1 >= total ? (nextCeremony(), 0) : s + 1)), [total, nextCeremony]);

  useEffect(() => {
    if (!current) return;
    const award = current.awards[step];
    if (award?.status === 'winner') {
      if (particles) triggerMilestoneCelebration('S', 'Gold');
      void gameAudio.playUISound('rankS');
    } else {
      void gameAudio.playUISound('comboUp');
    }
    const t = window.setTimeout(advance, STEP_MS);
    return () => window.clearTimeout(t);
  }, [current, step, particles, advance]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); nextCeremony(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, advance, nextCeremony]);

  if (!current) return null;
  const award = current.awards[step];
  const tint = award ? STATUS[award.status].tint : 'from-yellow-400 to-amber-600 text-black';
  const wins = current.awards.filter(a => a.status === 'winner').length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
      role="status"
      aria-live="polite"
      aria-label={`Studio Awards, year ${current.year}`}
      data-testid="season-awards-ceremony"
      onClick={advance}
    >
      <div key={step} className={`kenney-bevel chip-grain rank-stamp-in max-w-md rounded-2xl bg-gradient-to-b ${tint} px-10 py-8 text-center`}>
        <div className="text-xs font-bold tracking-widest opacity-80">STUDIO AWARDS · YEAR {current.year}</div>
        {award ? (
          <>
            <div className="my-3 text-2xl font-black">{award.name}</div>
            <div className="text-lg font-black tracking-wide">{STATUS[award.status].label}</div>
            <p className="mt-2 text-sm font-semibold opacity-90">{award.why}</p>
          </>
        ) : (
          <>
            <div className="my-3 text-2xl font-black">{wins} award{wins === 1 ? '' : 's'} won</div>
            {current.rewards.length > 0 ? (
              <ul className="flex flex-wrap justify-center gap-2 text-xs font-bold">
                {current.rewards.map(item => (
                  <li key={item.id} className="rounded bg-black/30 px-2 py-1 text-white">{item.icon ? `${item.icon} ` : ''}{item.label}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold opacity-90">Every result is in the yearbook.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
