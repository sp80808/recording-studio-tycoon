import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins, Sparkles } from 'lucide-react';
import { GameState } from '@/types/game';
import { rewardGains } from '@/utils/rewardFeedback';

type Flight = { id: number; type: 'money' | 'xp'; amount: number; fromX: number; fromY: number; toX: number; toY: number };

/** Kenney sprite chips for loot flights (decorative — amount text is the payload). */
const FLIGHT_SPRITE: Record<Flight['type'], string> = {
  money: '/assets/kenney-ui/PNG/Green/Double/star.png',
  xp: '/assets/kenney-ui/PNG/Yellow/Double/star.png',
};

/** Deterministic per-flight variance from the serial id (no render-path RNG). */
const flightVariance = (id: number): { lift: number; duration: number; scale: number } => ({
  lift: 12 + ((id * 37) % 20),
  duration: 1.15 + ((id * 53) % 30) / 100,
  scale: 1,
});

/** Visual feedback only. The shared game state remains the reward authority. */
export function RewardFlights({ gameState }: { gameState: GameState }) {
  const snapshot = { money: gameState.money, xp: gameState.playerData.xp, level: gameState.playerData.level, day: gameState.currentDay };
  const previous = useRef(snapshot);
  const serial = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const next = { money: gameState.money, xp: gameState.playerData.xp, level: gameState.playerData.level, day: gameState.currentDay };
    const gains = rewardGains(previous.current, next);
    previous.current = next;
    const source = document.querySelector('[data-reward-source="activity"]') ??
      document.querySelector('[data-reward-source="floor"]');
    const from = source?.getBoundingClientRect();
    const batch: Flight[] = [];
    for (const type of ['money', 'xp'] as const) {
      const target = document.querySelector(`[data-reward-target="${type}"]`)?.getBoundingClientRect();
      if (!gains[type] || !target?.width) continue;
      batch.push({
        id: ++serial.current, type, amount: gains[type],
        fromX: Math.max(8, Math.min(innerWidth - 115, from ? from.left + from.width / 2 - 50 : innerWidth / 2)),
        fromY: Math.max(8, Math.min(innerHeight - 44, from ? from.top + from.height / 2 : innerHeight / 2)),
        toX: Math.max(8, Math.min(innerWidth - 115, target.left)),
        toY: Math.min(innerHeight - 44, target.bottom + 4),
      });
    }
    if (batch.length) {
      setFlights(current => [...current, ...batch].slice(-6));
      setAnnouncement(batch.map(f => `+${f.amount.toLocaleString()} ${f.type === 'xp' ? 'XP' : 'cash'}`).join(', '));
    }
  }, [gameState.money, gameState.playerData.xp, gameState.playerData.level, gameState.currentDay]);

  useEffect(() => {
    const clear = () => setFlights([]);
    window.addEventListener('resize', clear);
    return () => window.removeEventListener('resize', clear);
  }, []);

  return createPortal(<>
    <span role="status" className="sr-only">{announcement}</span>
    {flights.map(flight => {
      const v = flightVariance(flight.id);
      // Big wins fly bigger: amount-tiered chip scale.
      const winScale = flight.amount >= 1000 ? 1.25 : flight.amount >= 300 ? 1.1 : 1;
      return <motion.div key={flight.id} aria-hidden="true"
      className={`studio-reward-flight relative ${flight.type === 'money' ? 'text-emerald-200 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.35)]' : 'text-amber-200 border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.35)]'}`}
      initial={{ x: reducedMotion ? flight.toX : flight.fromX, y: reducedMotion ? flight.toY : flight.fromY, opacity: 0, scale: .8 }}
      animate={reducedMotion
        ? { opacity: [0, 1, 1, 0], scale: 1 }
        : { x: [flight.fromX, (flight.fromX + flight.toX) / 2, flight.toX, flight.toX],
            y: [flight.fromY, Math.min(flight.fromY, flight.toY) - v.lift, flight.toY, flight.toY],
            opacity: [0, 1, 1, 0], scale: [.8 * winScale, 1.12 * winScale, winScale, .9 * winScale] }}
      transition={{ duration: reducedMotion ? .9 : v.duration, times: [0, .25, .8, 1], ease: 'easeInOut', delay: flight.type === 'xp' ? .12 : 0 }}
      onAnimationComplete={() => setFlights(current => current.filter(f => f.id !== flight.id))}>
      <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-white animate-ping opacity-75 pointer-events-none" />
      <img src={FLIGHT_SPRITE[flight.type]} alt="" width={17} height={17} loading="eager" />
      {flight.type === 'money' ? <Coins size={14} /> : <Sparkles size={14} />}
      +{flight.type === 'money' ? '$' : ''}{flight.amount.toLocaleString()}{flight.type === 'xp' ? ' XP' : ''}
    </motion.div>;})}
  </>, document.body);
}
