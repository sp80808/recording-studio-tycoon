import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { GameState } from '@/types/game';
import { rewardGains } from '@/utils/rewardFeedback';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import {
  REWARD_POP_EVENT, formatGain, isLevelUp, lootArc, lootDelay, lootDuration, rewardCoinCount,
  rewardPopScale, rewardTier, type Point, type RewardKind, type RewardPopDetail, type RewardTier,
} from '@/utils/rewardFx';

type Flight = {
  id: number; type: RewardKind; amount: number; tier: RewardTier; count: number;
  from: Point; to: Point; lite: boolean;
};
type Pop = { id: number; label: string; tier: RewardTier; tone: 'xp' | 'money' | 'gold' | 'silver' | 'plain'; x: number; y: number; lite: boolean };

/** Kenney sprite chips for loot flights (decorative — amount text is the payload). */
const FLIGHT_SPRITE: Record<RewardKind, string> = {
  money: '/assets/rewards/coin.svg',
  xp: '/assets/rewards/xp-star.svg',
};

const POP_TONE: Record<Pop['tone'], string> = {
  xp: '#ffd98a', money: '#8df0b8', gold: '#ffc83d', silver: '#dfe6ee', plain: '#f3e7cf',
};

/** Briefly pulse the HUD element a flight lands on. */
function pulseTarget(type: RewardKind) {
  const el = document.querySelector(`[data-reward-target="${type}"]`);
  if (!el) return;
  el.classList.remove('studio-reward-hit');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('studio-reward-hit');
  window.setTimeout(() => el.classList.remove('studio-reward-hit'), 520);
}

/** Fixed spark fan around a big pop-up (deterministic). */
const SPARK_OFFSETS: Array<[number, number]> = [[-46, -14], [44, -18], [-28, 18], [30, 16], [0, -30]];

const clampPoint = (x: number, y: number): Point => ({
  x: Math.max(8, Math.min(innerWidth - 115, x)),
  y: Math.max(8, Math.min(innerHeight - 44, y)),
});

/** Visual feedback only. The shared game state remains the reward authority. */
export function RewardFlights({ gameState }: { gameState: GameState }) {
  const snapshot = {
    money: gameState.money,
    xp: gameState.playerData.xp,
    level: gameState.playerData.level,
    day: gameState.currentDay,
    streak: gameState.choreState?.streakDays || 0,
  };
  const previous = useRef(snapshot);
  const serial = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [milestoneBanner, setMilestoneBanner] = useState<string | null>(null);
  const [levelBanner, setLevelBanner] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const capabilities = useMotionCapabilities();
  // Low preset / reduced motion: one static chip per gain, no fans, pops or pulses.
  const lite = Boolean(reducedMotion || capabilities.reducedMotion || !capabilities.particles);

  const sourcePoint = (): Point => {
    const source = document.querySelector('[data-reward-source="activity"]') ??
      document.querySelector('[data-reward-source="floor"]');
    const r = source?.getBoundingClientRect();
    return clampPoint(r ? r.left + r.width / 2 - 50 : innerWidth / 2, r ? r.top + r.height / 2 : innerHeight / 2);
  };

  const addPop = (pop: Omit<Pop, 'id' | 'lite'>) => {
    if (lite) return;
    const id = ++serial.current;
    setPops(current => [...current, { ...pop, id, lite }].slice(-5));
    window.setTimeout(() => setPops(current => current.filter(p => p.id !== id)), 1500);
  };

  useEffect(() => {
    const next = {
      money: gameState.money,
      xp: gameState.playerData.xp,
      level: gameState.playerData.level,
      day: gameState.currentDay,
      streak: gameState.choreState?.streakDays || 0,
    };
    const before = previous.current;
    previous.current = next;
    const gains = rewardGains(before, next);
    const timers: number[] = [];

    // Evaluate 3-day streak milestone callout
    if (next.streak >= 3 && next.streak > (before.streak || 0) && next.streak % 3 === 0) {
      setMilestoneBanner(`🎉 ${next.streak}-DAY CHORE STREAK! VINTAGE FLIGHT CRATE UNLOCKED!`);
      timers.push(window.setTimeout(() => setMilestoneBanner(null), 4500));
    }

    if (isLevelUp(before.level, next.level)) {
      setLevelBanner(next.level);
    }

    const from = sourcePoint();
    const batch: Flight[] = [];
    for (const type of ['money', 'xp'] as const) {
      const target = document.querySelector(`[data-reward-target="${type}"]`)?.getBoundingClientRect();
      if (!gains[type] || !target?.width) continue;
      const tier = rewardTier(type, gains[type]);
      batch.push({
        id: ++serial.current, type, amount: gains[type], tier, lite,
        count: rewardCoinCount(tier, lite),
        from,
        to: clampPoint(target.left, target.bottom + 4),
      });
      // XP pop-up rises from the work surface; cash pops sit beside it.
      addPop({ label: formatGain(type, gains[type]), tier, tone: type, x: from.x + (type === 'money' ? -46 : 46), y: from.y - 10 });
    }
    if (batch.length) {
      setFlights(current => [...current, ...batch].slice(-6));
      setAnnouncement(batch.map(f => `+${f.amount.toLocaleString()} ${f.type === 'xp' ? 'XP' : 'cash'}`).join(', ')
        + (isLevelUp(before.level, next.level) ? `, level ${next.level}` : ''));
    }
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.money, gameState.playerData.xp, gameState.playerData.level, gameState.currentDay, gameState.choreState?.streakDays]);

  // Level banner dismissal is independent of reward-state reruns.
  useEffect(() => {
    if (levelBanner === null) return;
    const timer = window.setTimeout(() => setLevelBanner(null), 2600);
    return () => window.clearTimeout(timer);
  }, [levelBanner]);

  // Action callouts (take grades etc.) emitted by gameplay components.
  useEffect(() => {
    const onPop = (e: Event) => {
      const d = (e as CustomEvent<RewardPopDetail>).detail;
      if (!d?.label) return;
      const at = sourcePoint();
      addPop({ label: d.label, tier: d.tier, tone: d.tone ?? 'plain', x: at.x, y: at.y - 44 });
    };
    window.addEventListener(REWARD_POP_EVENT, onPop);
    return () => window.removeEventListener(REWARD_POP_EVENT, onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lite]);

  useEffect(() => {
    const clear = () => setFlights([]);
    window.addEventListener('resize', clear);
    return () => window.removeEventListener('resize', clear);
  }, []);

  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(<>
    <span role="status" className="sr-only">{announcement}</span>

    {milestoneBanner && (
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.9 }}
        animate={{ y: 20, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-stone-900/95 border-2 border-amber-400 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.6)] text-amber-200 font-mono text-xs font-black tracking-wider flex items-center gap-2 select-none"
      >
        <span className="text-base animate-bounce">🏆</span>
        <span>{milestoneBanner}</span>
      </motion.div>
    )}

    {levelBanner !== null && (
      <motion.div aria-hidden="true" className="studio-level-up"
        initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.6, y: reducedMotion ? 0 : 10 }}
        animate={{ opacity: [0, 1, 1, 0], scale: reducedMotion ? 1 : [0.6, 1.15, 1, 1], y: reducedMotion ? 0 : [10, 0, 0, -14] }}
        transition={{ duration: 2.4, times: [0, .15, .8, 1] }}>
        LEVEL {levelBanner}!
      </motion.div>
    )}

    {pops.map(pop => {
      const scale = rewardPopScale(pop.tier);
      return <motion.div key={pop.id} aria-hidden="true" className="studio-reward-pop"
        style={{ left: pop.x, top: pop.y, color: POP_TONE[pop.tone], fontSize: 15 * scale }}
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 1, 0], y: [0, -14, -30 - 8 * scale, -58], scale: [0.5, 1.25, 1, 1] }}
        transition={{ duration: 1.3, times: [0, .14, .6, 1], ease: 'easeOut' }}>
        {pop.label}
        {(pop.tier === 'big' || pop.tier === 'jackpot') && SPARK_OFFSETS.map((o, i) =>
          <motion.img key={i} src="/assets/rewards/spark.svg" alt="" width={10} height={10} className="studio-pop-spark"
            initial={{ x: 0, y: 0, opacity: 0, scale: .3 }}
            animate={{ x: o[0], y: o[1], opacity: [0, 1, 0], scale: [.3, 1.2, .2], rotate: 90 }}
            transition={{ duration: .8, delay: i * .04 }} />)}
      </motion.div>;
    })}

    {flights.map(flight => flight.lite
      ? <motion.div key={flight.id} aria-hidden="true"
          className={`studio-reward-flight ${flight.type === 'money' ? 'text-emerald-200' : 'text-amber-200'}`}
          initial={{ x: flight.to.x, y: flight.to.y, opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: .9 }}
          onAnimationComplete={() => setFlights(current => current.filter(f => f.id !== flight.id))}>
          {formatGain(flight.type, flight.amount)}
        </motion.div>
      : <LootFlight key={flight.id} flight={flight}
          onDone={() => setFlights(current => current.filter(f => f.id !== flight.id))} />)}
  </>, document.body);
}

/** A fan of sprite dots that burst from the work surface and sweep into the HUD counter. */
function LootFlight({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const { type, tier, count, from, to, id } = flight;
  const dots = Array.from({ length: count }, (_, i) => ({ i, arc: lootArc(from, to, i, count, id), dur: lootDuration(id, i), delay: lootDelay(i) + (type === 'xp' ? .1 : 0) }));
  const size = tier === 'jackpot' ? 24 : tier === 'big' ? 21 : 17;
  return <>
    {dots.map(d => <motion.img key={d.i} aria-hidden="true" alt="" src={FLIGHT_SPRITE[type]}
      width={size} height={size} className="studio-loot-dot"
      initial={{ x: from.x, y: from.y, opacity: 0, scale: .4 }}
      animate={{ x: d.arc.x, y: d.arc.y, opacity: [0, 1, 1, 0], scale: [.4, 1.2, 1, .5], rotate: [0, 120, 240, 360] }}
      transition={{ duration: d.dur, delay: d.delay, times: [0, .3, .65, 1], ease: 'easeInOut' }}
      onAnimationComplete={() => {
        pulseTarget(type);
      }} />)}
    <motion.div aria-hidden="true"
      className={`studio-reward-flight ${type === 'money' ? 'text-emerald-200' : 'text-amber-200'}`}
      initial={{ x: to.x, y: to.y, opacity: 0, scale: .8 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [.8, 1.1, 1, .95] }}
      transition={{ duration: 1.1 + count * .05, delay: .55, times: [0, .2, .75, 1] }}
      onAnimationComplete={onDone}>
      {formatGain(type, flight.amount)}
    </motion.div>
  </>;
}
