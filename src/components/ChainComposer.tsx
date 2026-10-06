import React, { useEffect, useRef, useState } from 'react';
import { AudioWaveform, Disc3, Mic, Sparkles, Undo2, Waves, type LucideIcon } from 'lucide-react';
import type { Equipment, GameState, Project } from '@/types/game';
import { getProjectBrief } from '@/rpg/projectBrief';
import {
  SIGNAL_SLOTS,
  SLOT_LABELS,
  availableForSlot,
  evaluateChain,
  formatChainStatusLine,
  suggestFill,
  validateChain,
  type SignalChain,
  type SignalSlot,
} from '@/rpg/signalChain';
import { conditionBand, type GearConditionBand } from '@/features/gearStudio/gearVisualState';
import { gameAudio } from '@/utils/audioSystem';
import { hapticTick } from '@/utils/mobilePlatform';
import './chain-composer.css';

interface ChainComposerProps {
  project: Project;
  state: GameState;
  chain?: SignalChain;
  onChange: (chain: SignalChain | undefined) => void;
}

const SLOT_ICON: Record<SignalSlot, LucideIcon> = {
  microphone: Mic,
  preamp: AudioWaveform,
  dynamics: Waves,
  recorderInterface: Disc3,
};

type SlotMotion = 'seat' | 'unseat';

const emptyChain = (project: Project): SignalChain => ({
  id: `chain-${project.id}`,
  name: 'Vocal chain',
  service: 'vocal-recording',
  roomId: project.bookingRoomId ?? 'studio-a',
  slots: {},
});

const gearById = (state: GameState, id?: string): Equipment | undefined =>
  id ? (state.ownedEquipment ?? []).find((g) => g.id === id) : undefined;

/** Diegetic four-slot vocal rack: tap a jack to assign or clear gear. */
export const ChainComposer: React.FC<ChainComposerProps> = ({ project, state, chain, onChange }) => {
  const [openSlot, setOpenSlot] = useState<SignalSlot | null>(null);
  const [motion, setMotion] = useState<Partial<Record<SignalSlot, SlotMotion>>>({});
  const [linger, setLinger] = useState<Partial<Record<SignalSlot, Equipment>>>({});
  const [undoSlots, setUndoSlots] = useState<SignalChain['slots'] | null>(null);
  const [latched, setLatched] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wasComplete = useRef<boolean | null>(null);
  const motionTimers = useRef<Partial<Record<SignalSlot, number>>>({});

  const current = chain ?? emptyChain(project);
  const brief = getProjectBrief(project);
  const validation = chain ? validateChain(chain, state, project.id) : null;
  const ev = chain ? evaluateChain(chain, state, state.hiredStaff, brief) : null;

  const complete = Boolean(validation && validation.valid && validation.filled.length === SIGNAL_SLOTS.length);
  useEffect(() => {
    // First render only records the starting state, so reopening a finished chain stays quiet.
    if (wasComplete.current === null) {
      wasComplete.current = complete;
      return;
    }
    if (complete && !wasComplete.current) {
      setLatched(true);
      hapticTick([14, 40, 22]);
      void gameAudio.playGearSwitch(0.8);
      const t = window.setTimeout(() => setLatched(false), 1400);
      wasComplete.current = complete;
      return () => window.clearTimeout(t);
    }
    wasComplete.current = complete;
    if (!complete) setLatched(false);
  }, [complete]);

  useEffect(() => () => {
    Object.values(motionTimers.current).forEach((id) => id && window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!openSlot) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenSlot(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSlot(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openSlot]);

  const pulse = (slot: SignalSlot, kind: SlotMotion, ms = 320) => {
    const prev = motionTimers.current[slot];
    if (prev) window.clearTimeout(prev);
    setMotion((m) => ({ ...m, [slot]: kind }));
    motionTimers.current[slot] = window.setTimeout(() => {
      setMotion((m) => {
        const next = { ...m };
        delete next[slot];
        return next;
      });
      if (kind === 'unseat') {
        setLinger((l) => {
          if (!l[slot]) return l;
          const next = { ...l };
          delete next[slot];
          return next;
        });
      }
    }, ms);
  };

  const writeSlots = (slots: SignalChain['slots']) => {
    onChange(Object.keys(slots).length ? { ...current, slots } : undefined);
  };

  const setSlot = (slot: SignalSlot, id: string | undefined) => {
    setUndoSlots({ ...current.slots });
    hapticTick(id ? 14 : 8);
    const slots = { ...current.slots };
    const previous = gearById(state, slots[slot]);
    if (id) {
      slots[slot] = id;
      setLinger((l) => {
        if (!l[slot]) return l;
        const next = { ...l };
        delete next[slot];
        return next;
      });
      pulse(slot, 'seat');
      void gameAudio.playGearSwitch(0.45);
      writeSlots(slots);
      return;
    }
    delete slots[slot];
    if (previous) {
      setLinger((l) => ({ ...l, [slot]: previous }));
      pulse(slot, 'unseat', 260);
      void gameAudio.playTactileClick(0.5);
    }
    writeSlots(slots);
  };

  const quickFill = () => {
    const { slots, filled } = suggestFill(current, state, state.hiredStaff, brief, project.id);
    if (filled.length === 0) return;
    setUndoSlots({ ...current.slots });
    setOpenSlot(null);
    filled.forEach((slot, i) => window.setTimeout(() => {
      pulse(slot, 'seat');
      hapticTick(10);
      void gameAudio.playGearSwitch(0.4 + i * 0.1);
    }, i * 90));
    writeSlots(slots);
  };

  const undo = () => {
    if (!undoSlots) return;
    void gameAudio.playTactileClick(0.5);
    hapticTick(8);
    setUndoSlots(null);
    setOpenSlot(null);
    writeSlots(undoSlots);
  };

  const canQuickFill = SIGNAL_SLOTS.some(
    (slot) => !current.slots[slot] && availableForSlot(state, slot, project.id).length > 0,
  );

  const onJack = (slot: SignalSlot) => {
    hapticTick(6);
    void gameAudio.playTactileClick(0.4);
    setOpenSlot((prev) => (prev === slot ? null : slot));
  };

  const options = openSlot ? availableForSlot(state, openSlot, project.id) : [];
  const openFilledId = openSlot ? current.slots[openSlot] : undefined;
  // Keep the currently seated piece visible in the tray even if another project would mark it busy.
  const trayGear: Equipment[] = openSlot
    ? (() => {
        const list = [...options];
        const seated = gearById(state, openFilledId);
        if (seated && !list.some((g) => g.id === seated.id)) list.unshift(seated);
        return list;
      })()
    : [];

  const status = (() => {
    if (complete && !(validation && validation.broken.length)) return `Chain locked in · ${formatChainStatusLine(ev!, [])}`;
    if (!chain || !ev || !validation) return 'Tap a jack to patch mic → pre → dynamics → recorder';
    return formatChainStatusLine(ev, validation.broken);
  })();

  return (
    <div ref={rootRef} className={`chain-rack${latched ? ' is-latched' : ''}`} data-testid="chain-composer">
      <div className="chain-rack__ears chain-rack__ears--l" aria-hidden="true">
        <span className="chain-rack__screw" />
        <span className="chain-rack__screw" />
      </div>
      <div className="chain-rack__ears chain-rack__ears--r" aria-hidden="true">
        <span className="chain-rack__screw" />
        <span className="chain-rack__screw" />
      </div>

      <div className="chain-rack__head">
        <span className="rst-kicker !text-[10px]">Vocal chain</span>
        <span className="chain-rack__tools">
          {undoSlots && (
            <button type="button" className="chain-rack__tool" onClick={undo} aria-label="Undo last patch change" data-testid="chain-undo">
              <Undo2 size={13} aria-hidden="true" /> Undo
            </button>
          )}
          {canQuickFill && (
            <button type="button" className="chain-rack__tool is-primary" onClick={quickFill} aria-label="Quick fill empty jacks with best-fitting gear" data-testid="chain-quick-fill">
              <Sparkles size={13} aria-hidden="true" /> Quick fill
            </button>
          )}
          {!undoSlots && !canQuickFill && <span className="rst-muted text-[10px]">optional patch</span>}
        </span>
      </div>

      <div className="chain-rack__slots" role="group" aria-label="Vocal signal chain slots">
        <div className="chain-rack__patch" aria-hidden="true">
          {SIGNAL_SLOTS.slice(0, -1).map((slot, i) => {
            const next = SIGNAL_SLOTS[i + 1];
            const live = Boolean(current.slots[slot] && current.slots[next]);
            return <span key={slot} className={`chain-rack__patch-seg${live ? ' is-live' : ''}`} />;
          })}
        </div>

        {SIGNAL_SLOTS.map((slot) => {
          const Icon = SLOT_ICON[slot];
          const id = current.slots[slot];
          const gear = gearById(state, id) ?? linger[slot];
          const filled = Boolean(gear);
          const broken = Boolean(id && validation?.broken.includes(slot));
          const band: GearConditionBand | undefined = gear ? conditionBand(gear.condition ?? 100) : undefined;
          const motionClass = motion[slot] === 'seat' ? ' is-seating' : motion[slot] === 'unseat' ? ' is-unseating' : '';
          const hasOptions = Boolean(id) || Boolean(linger[slot]) || availableForSlot(state, slot, project.id).length > 0;

          return (
            <button
              key={slot}
              type="button"
              className={`chain-jack${filled ? ' is-filled' : ''}${openSlot === slot ? ' is-open' : ''}${motionClass}`}
              aria-pressed={openSlot === slot}
              aria-label={`${SLOT_LABELS[slot]}: ${gear?.name ?? 'empty jack'}`}
              title={gear ? `${gear.name} · ${Math.round(gear.condition ?? 100)}%` : `${SLOT_LABELS[slot]} — empty`}
              disabled={!hasOptions}
              onClick={() => onJack(slot)}
            >
              <span
                className={`chain-jack__well${filled ? ' is-filled' : ' is-empty'}${broken ? ' is-broken' : ''}`}
              >
                <Icon size={15} className="chain-jack__glyph" strokeWidth={1.75} aria-hidden="true" />
                {band && <span className="chain-jack__cue" data-band={band} aria-hidden="true" />}
              </span>
              <span className="chain-jack__label">{SLOT_LABELS[slot]}</span>
            </button>
          );
        })}
      </div>

      {openSlot && (
        <div className="chain-rack__tray" role="listbox" aria-label={`Assign ${SLOT_LABELS[openSlot]}`}>
          <div className="chain-rack__tray-title">{SLOT_LABELS[openSlot]} bay</div>
          <div className="chain-rack__options">
            {openFilledId && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="chain-rack__opt is-clear"
                onClick={() => {
                  setSlot(openSlot, undefined);
                  setOpenSlot(null);
                }}
              >
                Open jack
              </button>
            )}
            {trayGear.map((g) => {
              const active = openFilledId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`chain-rack__opt${active ? ' is-active' : ''}`}
                  onClick={() => {
                    if (active) {
                      setSlot(openSlot, undefined);
                    } else {
                      setSlot(openSlot, g.id);
                    }
                    setOpenSlot(null);
                  }}
                >
                  <span className="truncate">{g.name}</span>
                  <span className="chain-rack__opt-cond">{Math.round(g.condition ?? 100)}%</span>
                </button>
              );
            })}
            {trayGear.length === 0 && (
              <p className="chain-rack__empty-hint">No matching gear free for this bay.</p>
            )}
          </div>
        </div>
      )}

      <p className={`chain-rack__status${validation && validation.broken.length > 0 ? ' is-warn' : ''}`}>
        {status}
      </p>
    </div>
  );
};

export default ChainComposer;
