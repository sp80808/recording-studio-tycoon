import { money, moneySymbol, moneyValue } from '@/utils/displayMoney';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { gameAudio } from '@/utils/audioSystem';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { triggerMilestoneCelebration } from '@/utils/confettiJuice';
import {
  BankResult,
  CHARGE_MS,
  GOLD_ZONE,
  MIN_BANK_COMBO,
  PREVIEW_COMBO,
  TICK_STEPS,
  evaluateRelease,
  goldMaxCash,
  quoteBank,
  zoneForProgress,
} from '@/rpg/streakBank';
import './chip-fidelity.css';

/** Streak Bank (k6e.5) — the combo cash-out control.
 *
 * TAP  → bank the same-day take streak for a safe cash + XP payout (streak resets).
 * HOLD → charge a sweep with accelerating ticks + haptics; release in the
 *        68–82% GOLD window for ×1.6 and a preserved streak, early/late for
 *        ×0.85/×0.9 (streak resets), or let it fill for a safe ×1.0 floor.
 *
 * Input: pointer, keyboard (Space/Enter) and gamepad SELECT — each charge is
 * bound to the source that started it so mixed input can't double-settle.
 * Reduced motion keeps the sweep (functional state) but drops decorative
 * animation/confetti; audio and haptics stay on per the k6e constraints.
 */

interface StreakBankControlProps {
  combo: number;
  level: number;
  onBank: (result: BankResult) => void;
  className?: string;
}

type ChargeSource = 'pointer' | 'key' | 'pad';
type Phase = 'idle' | 'charging' | 'settled';

export const StreakBankControl: React.FC<StreakBankControlProps> = ({
  combo,
  level,
  onBank,
  className = '',
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BankResult | null>(null);

  const progressRef = useRef(0);
  const startRef = useRef(0);
  const tickIdxRef = useRef(-1);
  const settledRef = useRef(false);
  const sourceRef = useRef<ChargeSource>('pointer');
  const settleTimerRef = useRef<number | null>(null);
  const onBankRef = useRef(onBank);
  onBankRef.current = onBank;

  const reduceMotion = useReducedMotion();
  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  const unlocked = combo >= MIN_BANK_COMBO;
  const quote = quoteBank(combo, level);
  const maxCash = goldMaxCash(combo, level);
  const needleZone = zoneForProgress(progress);
  const inGold = phase === 'charging' && needleZone === 'gold';

  useEffect(
    () => () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    },
    []
  );

  const abortCharge = useCallback(() => {
    progressRef.current = 0;
    setProgress(0);
    tickIdxRef.current = -1;
    settledRef.current = false;
    setPhase('idle');
  }, []);

  const settle = useCallback(
    (p: number) => {
      if (settledRef.current) return;
      settledRef.current = true;
      const evaluated = evaluateRelease(combo, level, p);
      progressRef.current = Math.min(1, Math.max(0, p));
      setProgress(progressRef.current);
      setResult(evaluated);
      setPhase('settled');
      onBankRef.current(evaluated);

      if (evaluated.zone === 'gold') {
        void gameAudio.playComboUp(3);
        void gameAudio.playSuccess();
        gamepad.triggerHaptic(0.8, 0.9, 160);
        if (!reduceMotion) triggerMilestoneCelebration('GOLD', 'Streak Bank');
      } else if (evaluated.zone === 'filled') {
        void gameAudio.playEquipmentPurchase();
        gamepad.triggerHaptic(0.4, 0.5, 100);
      } else {
        void gameAudio.playError();
        gamepad.triggerHaptic(0.25, 0.2, 90);
      }

      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        settledRef.current = false;
        progressRef.current = 0;
        setProgress(0);
        tickIdxRef.current = -1;
        setResult(null);
        setPhase('idle');
      }, 2600);
    },
    [combo, level, gamepad, reduceMotion]
  );

  const beginCharge = useCallback(
    (source: ChargeSource) => {
      if (!unlocked || phase !== 'idle') return;
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      settledRef.current = false;
      sourceRef.current = source;
      tickIdxRef.current = -1;
      progressRef.current = 0;
      setProgress(0);
      startRef.current = performance.now();
      setPhase('charging');
      void gameAudio.playTactileClick(0.55);
      gamepad.triggerHaptic(0.2, 0.2, 40);
    },
    [unlocked, phase, gamepad]
  );

  // Charge sweep: one rAF loop while charging — progress, accelerating ticks,
  // haptic pulses, and the auto "filled" floor at 100%.
  useEffect(() => {
    if (phase !== 'charging') return;
    let raf = 0;
    let stopped = false;
    const loop = () => {
      if (stopped) return;
      const p = Math.min(1, (performance.now() - startRef.current) / CHARGE_MS);
      progressRef.current = p;
      setProgress(p);

      let idx = -1;
      for (let i = 0; i < TICK_STEPS.length; i += 1) {
        if (p >= TICK_STEPS[i]) idx = i;
      }
      if (idx > tickIdxRef.current) {
        tickIdxRef.current = idx;
        void gameAudio.playTactileClick(0.3 + 0.45 * p);
        gamepad.triggerHaptic(0.12 + 0.45 * p, 0.1 + 0.35 * p, 25);
      }

      if (p >= 1) {
        settle(1);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [phase, settle, gamepad]);

  // Gamepad SELECT: press starts a pad-sourced charge, release settles it.
  useEffect(() => {
    if (!gamepad.isConnected) {
      if (phase === 'charging' && sourceRef.current === 'pad') abortCharge();
      return;
    }
    if (gamepad.justPressed.select) {
      beginCharge('pad');
    } else if (phase === 'charging' && sourceRef.current === 'pad' && !gamepad.buttons.select) {
      settle(progressRef.current);
    }
  }, [
    gamepad.isConnected,
    gamepad.justPressed.select,
    gamepad.buttons.select,
    phase,
    beginCharge,
    settle,
    abortCharge,
  ]);

  // Focus loss mid-charge would strand key/pad charges — abort penalty-free.
  useEffect(() => {
    const abort = () => {
      if (phase === 'charging') abortCharge();
    };
    const onVisibility = () => {
      if (document.hidden) abort();
    };
    window.addEventListener('blur', abort);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', abort);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [phase, abortCharge]);

  // The control swaps its root element (button → sweep panel) when charging
  // starts, which drops the button-local pointer capture — so pointer-sourced
  // charges settle/abort from window-level listeners instead.
  useEffect(() => {
    if (phase !== 'charging' || sourceRef.current !== 'pointer') return;
    const onUp = () => settle(progressRef.current);
    const onCancel = () => abortCharge();
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [phase, settle, abortCharge]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (phase !== 'idle' || !unlocked) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    beginCharge('pointer');
  };
  const handlePointerUp = () => {
    if (phase === 'charging' && sourceRef.current === 'pointer') settle(progressRef.current);
  };
  const handlePointerCancel = () => {
    if (phase === 'charging' && sourceRef.current === 'pointer') abortCharge();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat) beginCharge('key');
  };
  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (phase === 'charging' && sourceRef.current === 'key') settle(progressRef.current);
  };

  // ── Settled chip ──────────────────────────────────────────────────────────
  if (phase === 'settled' && result) {
    const gold = result.zone === 'gold';
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-[2px] border chip-grain ${
          gold
            ? 'bg-amber-950/70 border-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.45)]'
            : result.zone === 'filled'
              ? 'bg-emerald-950/70 border-emerald-500/50'
              : 'bg-rose-950/60 border-rose-500/40'
        } ${className}`}
      >
        <div className="min-w-0">
          <div
            className={`text-xs font-black tracking-wider ${
              gold ? 'text-amber-200' : result.zone === 'filled' ? 'text-emerald-200' : 'text-rose-200'
            }`}
          >
            🏦 {result.label}
          </div>
          <div className="text-[10px] text-stone-400 truncate">{result.sublabel}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono">
          <span className="text-sm font-black text-emerald-300">
            <AnimatedCounter value={moneyValue(result.cash)} prefix={moneySymbol()} duration={reduceMotion ? 0 : 700} />
          </span>
          <span className="text-[10px] font-bold text-amber-200">+{result.xp} XP</span>
          <span className="text-[10px] font-black text-amber-300">
            {result.keepsCombo ? `⚡×${combo} KEPT` : '⚡ SPENT'}
          </span>
        </div>
      </div>
    );
  }


  // ── Charging sweep ────────────────────────────────────────────────────────
  if (phase === 'charging') {
    return (
      <div
        className={`border border-stone-700 bg-stone-950/85 rounded-[2px] p-2 space-y-1.5 kenney-bevel ${className}`}
        aria-label={`Charging streak bank, ${Math.round(progress * 100)} percent`}
      >
        <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider">
          <span className="text-amber-300">🏦 STREAK BANK · ⚡×{combo}</span>
          <span className={inGold ? 'text-amber-200 font-black' : 'text-stone-300'}>
            {inGold ? '★ RELEASE NOW! ★' : `SWEEP ${Math.round(progress * 100)}%`}
          </span>
        </div>
        <div className="relative h-8 rounded-[2px] bg-stone-900 border border-stone-700 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-stone-800/90"
            style={{ width: `${GOLD_ZONE[0] * 100}%` }}
          />
          <div
            className={`absolute inset-y-0 ${inGold ? 'bg-amber-400/90' : 'bg-amber-500/55'}`}
            style={{ left: `${GOLD_ZONE[0] * 100}%`, width: `${(GOLD_ZONE[1] - GOLD_ZONE[0]) * 100}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-rose-950/85"
            style={{ left: `${GOLD_ZONE[1] * 100}%` }}
          />
          {TICK_STEPS.map((t) => (
            <div
              key={t}
              className="absolute top-0 w-px h-1.5 bg-stone-500/70"
              style={{ left: `${t * 100}%` }}
            />
          ))}
          <div
            className={`absolute inset-y-0 w-0.5 ${inGold ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'bg-white/90'}`}
            style={{ left: `calc(${progress * 100}% - 1px)` }}
          />
        </div>
        <p className="text-[10px] text-center text-stone-400 leading-tight">
          Release inside the <span className="text-amber-300 font-bold">GOLD</span> band for ×1.6 + streak
          kept · let it fill for a safe ×1.0
        </p>
      </div>
    );
  }

  // ── Locked preview (streak is starting to build) ──────────────────────────
  if (!unlocked) {
    if (combo < PREVIEW_COMBO) return null;
    return (
      <div
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-[2px] border border-stone-800 bg-stone-900/50 text-[10px] font-mono text-stone-500 ${className}`}
        aria-label={`Streak Bank unlocks at combo 3 (currently ${combo})`}
      >
        <span>🏦 STREAK BANK LOCKED</span>
        <span>unlocks at ⚡×{MIN_BANK_COMBO}</span>
      </div>
    );
  }

  // ── Idle: armed and waiting ───────────────────────────────────────────────
  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label={`Streak Bank: tap to bank combo ${combo} for ${quote.cash} dollars, or hold to amplify up to ${maxCash}`}
      title="TAP: bank safely. HOLD: release in the GOLD window for ×1.6 and keep the streak."
      className={`w-full rounded-[2px] border border-amber-500/50 bg-amber-950/40 text-left select-none touch-none cursor-pointer kenney-bevel chip-grain ${
        reduceMotion ? '' : 'shadow-[0_0_10px_rgba(251,191,36,0.3)] animate-pulse'
      } ${className}`}
      style={reduceMotion ? { boxShadow: '0 0 10px rgba(251,191,36,0.3)' } : undefined}
    >
      <span className="flex items-center justify-between px-2.5 pt-2 gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="text-base">🏦</span>
          <span className="text-xs font-black tracking-wider text-amber-200">STREAK BANK</span>
          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] bg-amber-900/60 border border-amber-500/40 text-amber-100">
            ⚡×{combo}
          </span>
          {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
            <GamepadGlyph button="select" size="xs" />
          )}
        </span>
        <span className="font-mono text-sm font-black text-emerald-300 shrink-0">
          {money(quote.cash)}
          {maxCash > quote.cash && (
            <span className="text-[10px] font-bold text-amber-400/90"> → up to {money(maxCash)}</span>
          )}
        </span>
      </span>
      <span className="block pb-1.5 text-[9px] uppercase tracking-[0.18em] text-stone-400 px-2.5">
        tap to bank · hold to amplify
      </span>
    </button>
  );
};

