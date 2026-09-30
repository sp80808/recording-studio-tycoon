import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gameEvents } from '@/engine/gameEventBus';
import { gameAudio } from '@/utils/audioSystem';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import {
  MINIGAME_SUCCESS_SCORE,
  RewardItem,
  RewardMoment,
  buildRevealSteps,
  collectRewardItems,
  isRevealUnlocked,
  payoffTierForPosition,
  stepDelayMs,
} from '@/utils/chartReveal';
import './chip-fidelity.css';

type Scene =
  | { kind: 'chart'; id: number; title: string; chartName: string; position: number; previous?: number }
  | { kind: 'minigame'; id: number; title: string; score: number };

const TIER_COPY = {
  top1: { label: 'NUMBER ONE', tint: 'from-yellow-300 via-amber-400 to-yellow-600 text-black' },
  top10: { label: 'TOP 10', tint: 'from-yellow-400 to-amber-600 text-black' },
  top40: { label: 'ON THE CHARTS', tint: 'from-stone-500 to-stone-700 text-white' },
  chart: { label: 'CHARTED', tint: 'from-stone-600 to-stone-800 text-white' },
} as const;

/**
 * Suspense ticker → landing → payoff. Plays a chart position reveal, or a short
 * celebration for a strong minigame result. Hidden below REVEAL_MIN_LEVEL.
 * Reduced motion: no ticker, straight to the result with its sound.
 */
export const ChartRevealScene: React.FC<{ playerLevel: number }> = ({ playerLevel }) => {
  const { reducedMotion } = useMotionCapabilities();
  const [scene, setScene] = useState<Scene | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const [landed, setLanded] = useState(false);
  const [items, setItems] = useState<RewardItem[]>([]);
  const serial = useRef(0);
  const queue = useRef<Scene[]>([]);
  const unlocked = isRevealUnlocked(playerLevel);

  const next = useCallback(() => {
    setScene(queue.current.shift() ?? null);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const offChart = gameEvents.on('chart:placement', p => {
      queue.current.push({ kind: 'chart', id: ++serial.current, title: p.title, chartName: p.chartName, position: p.position, previous: p.previousPosition });
      setScene(cur => cur ?? queue.current.shift() ?? null);
    });
    const offMini = gameEvents.on('minigame:success', p => {
      if (p.score < MINIGAME_SUCCESS_SCORE) return;
      queue.current.push({ kind: 'minigame', id: ++serial.current, title: p.minigameType ?? 'Mini-game', score: p.score });
      setScene(cur => cur ?? queue.current.shift() ?? null);
    });
    return () => { offChart(); offMini(); };
  }, [unlocked]);

  useEffect(() => {
    if (!scene) return;
    setLanded(false);
    const timers: number[] = [];
    const land = (tier: RewardMoment['tier']) => {
      setLanded(true);
      setItems(collectRewardItems({
        source: scene.kind,
        tier,
        position: scene.kind === 'chart' ? scene.position : undefined,
        score: scene.kind === 'minigame' ? scene.score : undefined,
      }));
      void gameAudio.playUISound(tier === 'top1' ? 'rankSPlus' : tier === 'top10' ? 'rankS' : 'comboUp');
      timers.push(window.setTimeout(next, 3200));
    };

    if (scene.kind === 'minigame') {
      setShown(null);
      land('top10');
    } else {
      const tier = payoffTierForPosition(scene.position);
      const steps = reducedMotion ? [scene.position] : buildRevealSteps(scene.position, `${scene.chartName}:${scene.title}:${scene.id}`);
      let at = 0;
      steps.forEach((value, i) => {
        timers.push(window.setTimeout(() => {
          setShown(value);
          if (!reducedMotion && i < steps.length - 1) void gameAudio.playUISound('workTick');
          if (i === steps.length - 1) land(tier);
        }, at));
        at += stepDelayMs(i, steps.length);
      });
    }
    return () => timers.forEach(window.clearTimeout);
  }, [scene, reducedMotion, next]);

  if (!unlocked || !scene) return null;

  const tier = scene.kind === 'chart' ? payoffTierForPosition(scene.position) : 'top10';
  const copy = TIER_COPY[tier];
  const label = scene.kind === 'chart'
    ? `${scene.title} charts at number ${scene.position} on ${scene.chartName}`
    : `${scene.title} success`;
  const climbed = scene.kind === 'chart' && scene.previous !== undefined ? scene.previous - scene.position : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
      role="status"
      aria-live="polite"
      aria-label={landed ? label : 'Revealing chart position'}
      onClick={landed ? next : undefined}
    >
      <div className={`kenney-bevel chip-grain rounded-2xl bg-gradient-to-b ${landed ? copy.tint : 'from-stone-700 to-stone-900 text-amber-200'} px-14 py-9 text-center ${landed ? 'rank-stamp-in' : ''}`}>
        {scene.kind === 'chart' ? (
          <>
            <div className="text-xs font-bold tracking-widest opacity-80">{scene.chartName.toUpperCase()}</div>
            <div className="my-2 font-mono text-8xl font-black tabular-nums" aria-hidden="true">
              {landed || reducedMotion ? `#${scene.position}` : shown !== null ? `#${shown}` : '#--'}
            </div>
            <div className="text-sm font-semibold">{scene.title}</div>
          </>
        ) : (
          <>
            <div className="text-6xl font-black">★</div>
            <div className="mt-2 text-sm font-semibold">{scene.title}</div>
          </>
        )}
        {landed ? (
          <div className="mt-3 text-base font-black tracking-wide">
            {scene.kind === 'chart' ? copy.label : 'FLAWLESS RUN'}
            {climbed > 0 ? ` · UP ${climbed}` : ''}
          </div>
        ) : (
          <div className="mt-3 text-sm font-bold opacity-70">WAITING ON THE NUMBERS…</div>
        )}
        {landed && items.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold">
            {items.map(item => (
              <li key={item.id} className="rounded bg-black/30 px-2 py-1 text-white">{item.icon ? `${item.icon} ` : ''}{item.label}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
