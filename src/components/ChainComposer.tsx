import React, { useEffect, useRef, useState } from 'react';
import { AudioWaveform, Disc3, Mic, Sparkles, Star, Undo2, Waves, type LucideIcon } from 'lucide-react';
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
import { DRAG_START_PX, exceedsDragThreshold, findSnapTarget, magneticPosition, type Point } from '@/rpg/chainPatchDrag';
import { hapticTick } from '@/utils/mobilePlatform';
import { tc, useContentLocale } from '@/i18n/content';
import { patchLesson, suggestedGearForSlot } from '@/rpg/patchLearning';
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

interface DragState { gear: Equipment; point: Point; snap: SignalSlot | null }

const prefersReducedMotion = (): boolean => {
  if (typeof document !== 'undefined' && document.documentElement.dataset.reducedMotion === 'true') return true;
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  useContentLocale();
  const [openSlot, setOpenSlot] = useState<SignalSlot | null>(null);
  const [lessonSlot, setLessonSlot] = useState<SignalSlot | null>(null);
  const lessonTimer = useRef<number>();
  const [motion, setMotion] = useState<Partial<Record<SignalSlot, SlotMotion>>>({});
  const [linger, setLinger] = useState<Partial<Record<SignalSlot, Equipment>>>({});
  const [undoSlots, setUndoSlots] = useState<SignalChain['slots'] | null>(null);
  const [latched, setLatched] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const jackRefs = useRef<Partial<Record<SignalSlot, HTMLButtonElement | null>>>({});
  const dragRef = useRef<{ gear: Equipment; start: Point; active: boolean; pointerId: number } | null>(null);
  const suppressClick = useRef(false);
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
    if (lessonTimer.current) window.clearTimeout(lessonTimer.current);
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
      setLessonSlot(slot);
      if (lessonTimer.current) window.clearTimeout(lessonTimer.current);
      lessonTimer.current = window.setTimeout(() => setLessonSlot(null), 7000);
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

  const jackTargets = (gear: Equipment) => SIGNAL_SLOTS.flatMap((slot) => {
    const el = jackRefs.current[slot];
    if (!el) return [];
    const r = el.getBoundingClientRect();
    const accepts = availableForSlot(state, slot, project.id).some((g) => g.id === gear.id);
    return [{ id: slot, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, accepts }];
  });

  const onChipPointerDown = (e: React.PointerEvent, gear: Equipment) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = { gear, start: { x: e.clientX, y: e.clientY }, active: false, pointerId: e.pointerId };
  };

  const onChipPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const point = { x: e.clientX, y: e.clientY };
    if (!d.active) {
      if (!exceedsDragThreshold(d.start, point, DRAG_START_PX)) return;
      d.active = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture is best effort */ }
      hapticTick(6);
    }
    const snap = findSnapTarget(point, jackTargets(d.gear)) as SignalSlot | null;
    setDrag((prev) => {
      if (snap && prev?.snap !== snap) hapticTick(5);
      return { gear: d.gear, point, snap };
    });
  };

  const endChipDrag = (e: React.PointerEvent, commit: boolean) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (!d.active) return;
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    const snap = commit ? findSnapTarget({ x: e.clientX, y: e.clientY }, jackTargets(d.gear)) as SignalSlot | null : null;
    setDrag(null);
    if (snap) {
      setSlot(snap, d.gear.id);
      setOpenSlot(null);
    }
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

  const favouriteId = openSlot ? suggestedGearForSlot(openSlot, current, state, state.hiredStaff, brief, project.id) : undefined;
  const lesson = lessonSlot && current.slots[lessonSlot] ? patchLesson(lessonSlot) : null;

  const status = (() => {
    if (complete && !(validation && validation.broken.length)) return `Chain locked in · ${formatChainStatusLine(ev!, [])}`;
    if (!chain || !ev || !validation) return 'Tap a jack (or drag gear onto one) to patch mic → pre → dynamics → recorder';
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
            return (
              <span key={slot} className={`chain-rack__patch-seg${live ? ' is-live' : ''}`}>
                <svg className="chain-cable" viewBox="0 0 100 24" preserveAspectRatio="none" focusable="false">
                  <path className="chain-cable__shadow" d="M0 4 C 22 26, 78 26, 100 4" vectorEffect="non-scaling-stroke" />
                  <path className="chain-cable__sheath" d="M0 4 C 22 22, 78 22, 100 4" vectorEffect="non-scaling-stroke" />
                  <path className="chain-cable__sheen" d="M0 4 C 22 22, 78 22, 100 4" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            );
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
              ref={(el) => { jackRefs.current[slot] = el; }}
              type="button"
              className={`chain-jack${drag?.snap === slot ? ' is-snap' : ''}${filled ? ' is-filled' : ''}${openSlot === slot ? ' is-open' : ''}${motionClass}`}
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
        <div className="chain-rack__tray chain-rack__foam" role="listbox" aria-label={`Assign ${SLOT_LABELS[openSlot]}`}>
          <span className="chain-rack__latch" aria-hidden="true" />
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
                  className={`chain-rack__opt${active ? ' is-active' : ''}${favouriteId === g.id ? ' is-favourite' : ''}${drag?.gear.id === g.id ? ' is-dragging' : ''}`}
                  onPointerDown={(e) => onChipPointerDown(e, g)}
                  onPointerMove={onChipPointerMove}
                  onPointerUp={(e) => endChipDrag(e, true)}
                  onPointerCancel={(e) => endChipDrag(e, false)}
                  onClick={() => {
                    if (suppressClick.current) return;
                    if (active) {
                      setSlot(openSlot, undefined);
                    } else {
                      setSlot(openSlot, g.id);
                    }
                    setOpenSlot(null);
                  }}
                >
                  <span className="truncate">{g.name}</span>
                  {favouriteId === g.id && (
                    <span className="chain-rack__fav" title={tc('chain.hint.suggested', 'Crew favourite for this brief')}>
                      <Star size={10} aria-hidden="true" />
                      <span className="sr-only">{tc('chain.hint.suggested', 'Crew favourite for this brief')}</span>
                    </span>
                  )}
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

      {drag && (() => {
        const snapEl = drag.snap ? jackRefs.current[drag.snap] : null;
        const r = snapEl?.getBoundingClientRect();
        const pos = magneticPosition(
          drag.point,
          r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null,
          prefersReducedMotion(),
        );
        return (
          <div className={`chain-drag-ghost${drag.snap ? ' is-snapped' : ''}`} style={{ left: pos.x, top: pos.y }} aria-hidden="true">
            {drag.gear.name}
          </div>
        );
      })()}

      {lesson && (
        <p className="chain-rack__lesson" role="status" data-testid="chain-lesson">
          {tc(lesson.id, lesson.english)}
        </p>
      )}

      <p className={`chain-rack__status${validation && validation.broken.length > 0 ? ' is-warn' : ''}`}>
        {status}
      </p>
    </div>
  );
};

export default ChainComposer;
