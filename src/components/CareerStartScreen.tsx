import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Swords } from 'lucide-react';
import { AVAILABLE_ERAS } from '@/data/eras';
import type { Era } from '@/types/game';
import { ModularSpriteRenderer } from '@/features/sprites/ModularSpriteRenderer';
import { identityFromSeed, resolveNpcAppearance } from '@/features/sprites/npcAppearance';
import {
  CREATOR_PART_SLOTS,
  DEFAULT_PART_PICKS,
  cyclePart,
  normalizePartPicks,
  partLabel,
  type CreatorPartSlot,
  type NpcPartPicks,
} from '@/features/sprites/characterCreatorParts';
import type { NpcEra } from '@/features/sprites/spriteTypes';
import type { CareerProducer, ProducerBackgroundId } from '@/types/character';
import { PRODUCER_ORIGINS } from '@/narrative/characterOrigins';
import { describeOriginPerks } from '@/narrative/originPerks';
import { getPrimaryRival, getRivalAccent, initialsOf } from '@/narrative/rivalCast';
import { getEraDecor } from '@/components/studio/studioDecorConfig';
import { THEME_VISUAL_CONFIGS } from '@/narrative/playstyleTheme';
import { visualEraId } from '@/utils/eraProgression';
import { getEraGrade } from '@/components/WebGLCanvas';
import { gameAudio } from '@/utils/audioSystem';
import { EraEmblem, type EraEmblemId } from './EraEmblems';
import './splash.css';

interface CareerStartScreenProps {
  onBegin: (era: Era, originId: ProducerBackgroundId, producer: CareerProducer) => void;
  onBack: () => void;
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

const DIFFICULTY_PIPS: Record<Era['difficulty'], number> = { Easy: 1, Medium: 2, Hard: 3, Legendary: 4 };

/** What each era asks of you — one line of *gameplay*, not just flavour. */
const ERA_CHALLENGE: Record<string, string> = {
  classic_rock: 'Tape is expensive and mistakes are permanent. Every take counts.',
  golden_age: 'Synths and MTV: gloss sells, but the gear bills arrive fast.',
  digital_age: 'Files leak and CDs fade. Stay ahead of the disruption.',
  modern: 'Everyone has a home studio. Win on taste and relationships.',
};

const STEPS = ['Era', 'Character', 'Role'] as const;

const PART_ROW_LABEL: Record<CreatorPartSlot, string> = {
  body: 'Body',
  hair: 'Hair',
  clothing: 'Clothing',
  accessories: 'Accessories',
};

const eraToNpcEra = (eraId: string | undefined): NpcEra =>
  eraId === 'classic_rock' ? '1960s' : eraId === 'golden_age' ? '1980s' : eraId === 'digital_age' ? '2000s' : 'modern';

const stepClass = (active: boolean, done: boolean) =>
  `flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] ${
    active ? 'text-[var(--rst-brass-300)]' : done ? 'text-stone-300' : 'text-stone-500'
  }`;

function PartArrowRow({
  slot,
  era,
  picks,
  onCycle,
}: {
  slot: CreatorPartSlot;
  era: NpcEra;
  picks: NpcPartPicks;
  onCycle: (slot: CreatorPartSlot, delta: number) => void;
}) {
  const label = PART_ROW_LABEL[slot];
  const value = partLabel(era, slot, picks[slot]);
  return (
    <div className="flex items-center gap-2" role="group" aria-label={`${label}: ${value}`}>
      <button
        type="button"
        className="rst-btn rst-btn-ghost !min-h-10 !min-w-10 !px-0"
        aria-label={`Previous ${label}`}
        onClick={() => onCycle(slot, -1)}
      >
        <ArrowLeft size={16} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1 rounded-md border border-[var(--rst-line)] bg-black/25 px-3 py-2 text-center">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rst-brass-200)]">{label}</span>
        <span className="rst-title mt-0.5 block truncate text-base leading-tight">{value}</span>
      </div>
      <button
        type="button"
        className="rst-btn rst-btn-ghost !min-h-10 !min-w-10 !px-0"
        aria-label={`Next ${label}`}
        onClick={() => onCycle(slot, 1)}
      >
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function CareerStartScreen({ onBegin, onBack }: CareerStartScreenProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [eraId, setEraId] = useState<string | null>(null);
  const [originId, setOriginId] = useState<ProducerBackgroundId | null>(null);
  const [moniker, setMoniker] = useState('The Architect');
  const [paletteSeed, setPaletteSeed] = useState(7);
  const [parts, setParts] = useState<NpcPartPicks>(DEFAULT_PART_PICKS);

  const headingRef = useRef<HTMLHeadingElement>(null);

  const era = useMemo(() => AVAILABLE_ERAS.find((e) => e.id === eraId) ?? null, [eraId]);
  const origin = useMemo(() => PRODUCER_ORIGINS.find((o) => o.id === originId) ?? null, [originId]);

  const characterEra = eraToNpcEra(era?.id);
  const appearance = useMemo(
    () =>
      identityFromSeed(paletteSeed, {
        role: 'producer',
        era: characterEra,
        parts: normalizePartPicks(characterEra, parts),
      }),
    [paletteSeed, characterEra, parts],
  );
  const producer = useMemo(
    () => resolveNpcAppearance(appearance, moniker.trim() || 'The Architect'),
    [appearance, moniker],
  );

  useEffect(() => {
    setParts(DEFAULT_PART_PICKS);
  }, [characterEra]);

  const click = () => void gameAudio.playClick().catch(() => {});

  const cycleCreatorPart = useCallback(
    (slot: CreatorPartSlot, delta: number) => {
      click();
      setParts((current) => cyclePart(current, slot, delta, characterEra));
    },
    [characterEra],
  );

  const goNext = useCallback(() => {
    if (step === 0 && era) {
      click();
      setStep(1);
    } else if (step === 1 && moniker.trim()) {
      click();
      setStep(2);
    } else if (step === 2 && era && origin) {
      click();
      onBegin(era, origin.id, { name: moniker.trim(), appearance });
    }
  }, [step, era, origin, moniker, appearance, onBegin]);

  const goBack = useCallback(() => {
    click();
    if (step > 0) setStep((current) => (current - 1) as 0 | 1 | 2);
    else onBack();
  }, [step, onBack]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goBack();
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack, goNext]);

  /** Arrow keys move the selection inside a radiogroup, as native radios would. */
  const arrowSelect = <T extends string>(items: readonly T[], current: T | null, set: (v: T) => void) =>
    (e: React.KeyboardEvent) => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const i = current ? items.indexOf(current) : -1;
      set(items[(i + dir + items.length) % items.length]);
    };

  const rival = origin ? getPrimaryRival(origin.primaryPlaystyle) : null;

  return (
    <main className="career-start-page" aria-label="Start a new career">
            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-8">
        {/* Header + stepper */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={goBack} className="rst-btn rst-btn-ghost !min-h-9 !px-3 !text-xs">
            <ArrowLeft size={14} aria-hidden="true" />
            {step === 0 ? 'Back' : step === 1 ? 'Change era' : 'Change character'}
          </button>
          <ol className="flex items-center gap-4" aria-label="Career setup progress">
            {STEPS.map((label, i) => (
              <li key={label} className={stepClass(i === step, i < step)} aria-current={i === step ? 'step' : undefined}>
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                    i < step ? 'border-[var(--rst-brass-400)] bg-[var(--rst-brass-400)] text-stone-950' : 'border-current'
                  }`}
                >
                  {i < step ? <Check size={11} aria-hidden="true" /> : i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </header>

        <div className="mt-8 text-center animate-rst-rise" key={step}>
          <p className="rst-kicker">{step === 0 ? 'Chapter one' : step === 1 ? 'Chapter two' : 'Chapter three'}</p>
          <h1 ref={headingRef} tabIndex={-1} className="rst-title mt-2 text-3xl outline-none sm:text-5xl">
            {step === 0 ? 'When does your studio open?' : step === 1 ? 'Make the face behind the faders' : 'Who is behind the console?'}
          </h1>
          <p className="rst-body mx-auto mt-3 max-w-2xl text-sm sm:text-base">
            {step === 0
              ? 'Each era changes your gear, your genres, your budget and the industry breathing down your neck.'
              : step === 1
                ? 'Dial in body, hair, clothes and accessories — your producer shows up at the console exactly like this.'
                : 'Your producer origin gives you a real edge — and a rival who will not let you forget it.'}
          </p>
        </div>

        {step === 0 && (
          <div
            role="radiogroup"
            aria-label="Choose an era"
            onKeyDown={arrowSelect(AVAILABLE_ERAS.map((e) => e.id), eraId, setEraId)}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[...AVAILABLE_ERAS].reverse().map((e, index) => {
              const visual = visualEraId(e.id) as EraEmblemId;
              const deco = getEraDecor(e.id);
              const glow = hex(deco.glow);
              const grade = getEraGrade(e.id);
              const selected = e.id === eraId;
              return (
                <button
                  key={e.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!eraId && index === 0) ? 0 : -1}
                  onClick={() => {
                    click();
                    setEraId(e.id);
                  }}
                  className="rst-option group relative flex flex-col items-center gap-3 !p-5 text-center animate-rst-rise"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    ...(selected ? { borderColor: glow, boxShadow: `0 0 0 1px ${glow} inset, 0 16px 40px rgba(0,0,0,.45), 0 0 34px ${glow}33` } : {}),
                  }}
                  aria-pressed={selected}
                >
                  <span className="absolute right-3 top-3 flex gap-0.5" aria-label={`Difficulty ${e.difficulty}`}>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-3 rounded-full"
                        style={{ background: i < DIFFICULTY_PIPS[e.difficulty] ? glow : 'rgba(243,236,221,0.12)' }}
                      />
                    ))}
                  </span>
                  <EraEmblem era={visual} size={92} className="transition-transform duration-300 group-hover:scale-105" />
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: glow }}>{e.startYear}s</span>
                    <span className="rst-title mt-0.5 block text-xl">{e.displayName}</span>
                  </span>
                  <span className="flex gap-1" aria-hidden="true" title="Room palette">
                    {[grade.wallLeft, grade.wallRight, grade.accent].map((c, i) => (
                      <span key={i} className="h-2 w-7 rounded-sm border border-white/10" style={{ background: hex(c) }} />
                    ))}
                  </span>
                  <span className="rst-body block text-xs leading-relaxed">{e.description}</span>
                  <span className="block text-[11px] italic leading-snug text-stone-400">“{e.funnyDescription}”</span>
                  <span className="mt-auto w-full space-y-2 border-t border-[var(--rst-line)] pt-3 text-left text-[11px]">
                    <span className="flex items-baseline justify-between"><span className="rst-muted">Starting cash</span><b className="text-[var(--rst-money)]">${e.startingMoney.toLocaleString()}</b></span>
                    <span className="flex items-baseline justify-between"><span className="rst-muted">Gear prices</span><b>{Math.round(e.equipmentMultiplier * 100)}% of modern</b></span>
                    <span className="block text-stone-300">{ERA_CHALLENGE[e.id] ?? ''}</span>
                  </span>
                  {selected && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-stone-950" style={{ background: glow }}>
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <section className="rst-option mx-auto mt-8 w-full max-w-xl !p-7" aria-label="Create your producer">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex justify-center" aria-live="polite">
                <ModularSpriteRenderer npc={producer} scale={4} />
              </div>
              <p className="rst-kicker mt-5">Create your producer</p>
              <p className="rst-body mt-2 text-xs">
                Use the arrows to mix layers. Clothing options follow your era; the live preview matches the studio floor figure.
              </p>
              <div className="mt-5 space-y-2.5 text-left">
                {CREATOR_PART_SLOTS.map((slot) => (
                  <PartArrowRow
                    key={slot}
                    slot={slot}
                    era={characterEra}
                    picks={parts}
                    onCycle={cycleCreatorPart}
                  />
                ))}
              </div>
              <button
                type="button"
                className="rst-btn rst-btn-ghost mt-4 w-full"
                onClick={() => {
                  click();
                  setPaletteSeed((seed) => seed + 1);
                }}
              >
                Shuffle colorway
              </button>
              <label className="mt-6 block text-left text-xs font-bold uppercase tracking-[0.18em] text-[var(--rst-brass-200)]">
                Producer name
                <input
                  value={moniker}
                  onChange={(e) => setMoniker(e.target.value.slice(0, 24))}
                  maxLength={24}
                  autoFocus
                  className="rst-input mt-2 w-full"
                  placeholder="The Architect"
                />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <div
            role="radiogroup"
            aria-label="Choose a producer origin"
            onKeyDown={arrowSelect<ProducerBackgroundId>(PRODUCER_ORIGINS.map((o) => o.id), originId, setOriginId)}
            className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {PRODUCER_ORIGINS.map((o, index) => {
              const theme = THEME_VISUAL_CONFIGS[o.preferredTheme];
              const selected = o.id === originId;
              const primaryRival = getPrimaryRival(o.primaryPlaystyle);
              const accent = getRivalAccent(primaryRival.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!originId && index === 0) ? 0 : -1}
                  onClick={() => {
                    click();
                    setOriginId(o.id);
                  }}
                  className="rst-option relative flex flex-col gap-3 !p-5 text-left animate-rst-rise"
                  style={{
                    animationDelay: `${index * 55}ms`,
                    ...(selected ? { borderColor: theme.primaryColor, boxShadow: `0 0 0 1px ${theme.primaryColor} inset, 0 16px 40px rgba(0,0,0,.45), 0 0 30px ${theme.primaryColor}2b` } : {}),
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="rst-serif grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 text-lg font-bold"
                      style={{
                        borderColor: theme.primaryColor,
                        color: theme.primaryColor,
                        background: `radial-gradient(circle at 30% 25%, ${theme.accentColor}55, transparent 70%), rgba(0,0,0,.35)`,
                      }}
                    >
                      {initialsOf(o.name.replace(/^The /, ''))}
                    </span>
                    <span className="min-w-0">
                      <span className="rst-title block truncate text-lg">{o.name}</span>
                      <span className="block text-[11px] leading-snug text-stone-400">{o.tagline}</span>
                    </span>
                  </span>

                  <span className="rst-body block text-left text-xs leading-relaxed">{o.lore}</span>

                  <span className="space-y-1.5 rounded-lg border border-[var(--rst-line)] bg-black/25 p-3 text-[11px] leading-snug">
                    <span className="rst-kicker block !text-[9px]">{o.passivePerk.name}</span>
                    {describeOriginPerks(o.id).map((line) => (
                      <span key={line} className="flex gap-1.5 text-stone-200">
                        <Check size={12} className="mt-0.5 shrink-0 text-[var(--rst-money)]" aria-hidden="true" />
                        {line}
                      </span>
                    ))}
                  </span>

                  <span className="flex flex-wrap gap-1.5">
                    {o.signatureGenres.slice(0, 4).map((g) => (
                      <span key={g} className="rst-chip">{g}</span>
                    ))}
                  </span>

                  {selected && (
                    <span className="absolute -top-2 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-stone-950" style={{ background: theme.primaryColor }}>
                      Selected
                    </span>
                  )}
                  <span className="mt-auto flex items-center gap-2 border-t border-[var(--rst-line)] pt-3 text-[11px] text-stone-400">
                    <Swords size={13} style={{ color: accent }} aria-hidden="true" />
                    Rival: <b className="text-stone-200">{primaryRival.headProducer}</b>
                    <span className="truncate">· {primaryRival.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky footer: the summary + the one primary action */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--rst-line-strong)] bg-[rgba(14,12,10,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <p className="min-w-0 flex-1 text-xs text-stone-300" aria-live="polite">
            {era ? <b className="text-[var(--rst-brass-200)]">{era.displayName}</b> : <span className="text-stone-500">No era chosen</span>}
            <span className="mx-2 text-stone-600">·</span>
            <b className="text-[var(--rst-brass-200)]">{moniker || 'Unnamed producer'}</b>
            <span className="mx-2 text-stone-600">·</span>
            {origin ? <b className="text-[var(--rst-brass-200)]">{origin.name}</b> : <span className="text-stone-500">No role chosen</span>}
            {era && <span className="ml-2 text-stone-500">${era.startingMoney.toLocaleString()} to start</span>}
            {rival && <span className="ml-2 hidden text-stone-500 sm:inline">· facing {rival.headProducer}</span>}
          </p>
          <button
            type="button"
            className="rst-btn rst-btn-primary min-w-44"
            disabled={step === 0 ? !era : step === 1 ? !moniker.trim() : !(era && origin)}
            onClick={goNext}
          >
            {step === 0 ? 'Create your producer' : step === 1 ? 'Choose a role' : 'Open the studio'}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </main>
  );
}
