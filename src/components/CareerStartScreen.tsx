import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Dices, Globe2, Landmark, MapPin, Radio, Swords, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_ERAS } from '@/data/eras';
import type { Era } from '@/types/game';
import type { ProducerBackgroundId } from '@/types/character';
import { PRODUCER_ORIGINS } from '@/narrative/characterOrigins';
import { describeOriginPerks } from '@/narrative/originPerks';
import { getPrimaryRival, getRivalAccent, initialsOf } from '@/narrative/rivalCast';
import { getEraDecor } from '@/components/studio/studioDecorConfig';
import { THEME_VISUAL_CONFIGS } from '@/narrative/playstyleTheme';
import { visualEraId } from '@/utils/eraProgression';
import { getEraGrade } from '@/components/WebGLCanvas';
import { gameAudio } from '@/utils/audioSystem';
import { ModularSpriteRenderer } from '@/features/sprites/ModularSpriteRenderer';
import {
  DEFAULT_PRODUCER_APPEARANCE,
  PRODUCER_ACCESSORIES,
  PRODUCER_BUILDS,
  PRODUCER_SKIN_TONES,
  PRODUCER_SHIRTS,
  PRODUCER_PANTS,
  PRODUCER_SHOES,
  PRODUCER_CLOTHES_COLOURS,
  PRODUCER_HAIR_COLOURS,
  PRODUCER_HAIR_SHAPES,
  buildProducerNpc,
  type ProducerAppearance,
  type ProducerClothesColourId,
} from '@/features/sprites/producerAppearance';
import { HAIR_HEX, CLOTHING_PALETTES } from '@/features/sprites/npcAppearanceData';
import { CitySkyline } from '@/components/CitySkyline';
import { useContentLocale } from '@/i18n/content';
import { CITIES, DEFAULT_CITY_ID, cityText, currencyFor, describeCity, formatMoney, getCityById, localName, type CityId } from '@/rpg/cities';
import { ProducerCreator } from '@/components/ProducerCreator';
import { EraEmblem, type EraEmblemId } from './EraEmblems';
import './splash.css';

/** The producer the player made on this screen: name + sprite look (persisted as ProducerCustomization). */
export interface ProducerSetup {
  name: string;
  appearance: ProducerAppearance;
  /** Home city: currency display, regional taste, local names and events. */
  cityId?: CityId;
}

interface CareerStartScreenProps {
  onBegin: (era: Era, originId: ProducerBackgroundId, producer: ProducerSetup) => void;
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

const STEP_KEYS = ['location', 'era', 'character', 'role'] as const;

const CITY_ICONS = { 'los-angeles': Radio, nashville: Waves, london: Landmark, berlin: Building2, tokyo: Globe2, rio: MapPin } as const;

const stepClass = (active: boolean, done: boolean) =>
  `flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] ${
    active ? 'text-[var(--rst-brass-300)]' : done ? 'text-stone-300' : 'text-stone-500'
  }`;

/** Cycle one step through a fixed option list, wrapping around. */
const cycleOption = <T extends string>(list: readonly T[], current: T, delta: number): T =>
  list[(list.indexOf(current) + delta + list.length) % list.length];

export function CareerStartScreen({ onBegin, onBack }: CareerStartScreenProps) {
  const { t } = useTranslation();
  useContentLocale();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [eraId, setEraId] = useState<string | null>(null);
  const [originId, setOriginId] = useState<ProducerBackgroundId | null>(null);
  const [moniker, setMoniker] = useState('The Architect');
  const [cityId, setCityId] = useState<CityId>(DEFAULT_CITY_ID);
  const [look, setLook] = useState<ProducerAppearance>(() => ({
    ...DEFAULT_PRODUCER_APPEARANCE,
    seed: Math.floor(Math.random() * 100000), // UI-only roll of the body; persisted once chosen
  }));
  /** "Surprise me": a local name and a fresh look. UI-only rolls; the chosen result is what persists. */
  const randomise = () => {
    click();
    const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
    const local = localName(cityId, Math.random(), Math.random());
    if (local) setMoniker(local.slice(0, 24));
    setLook((current) => ({
      ...current,
      build: pick(PRODUCER_BUILDS),
      skinTone: pick(PRODUCER_SKIN_TONES),
      shirt: pick(PRODUCER_SHIRTS),
      pants: pick(PRODUCER_PANTS),
      shoes: pick(PRODUCER_SHOES),
      hair: pick(PRODUCER_HAIR_SHAPES),
      hairColour: pick(PRODUCER_HAIR_COLOURS),
      clothesColour: pick(PRODUCER_CLOTHES_COLOURS).id as ProducerClothesColourId,
      accessory: pick(PRODUCER_ACCESSORIES),
      seed: Math.floor(Math.random() * 100000),
    }));
  };
  const patchLook = (patch: Partial<ProducerAppearance>) => {
    click();
    setLook((current) => ({ ...current, ...patch }));
  };

  const headingRef = useRef<HTMLHeadingElement>(null);

  const era = useMemo(() => AVAILABLE_ERAS.find((e) => e.id === eraId) ?? null, [eraId]);
  const previewNpc = useMemo(() => buildProducerNpc(look, moniker, eraId ?? undefined), [look, moniker, eraId]);
  const origin = useMemo(() => PRODUCER_ORIGINS.find((o) => o.id === originId) ?? null, [originId]);

  const click = () => void gameAudio.playClick().catch(() => {});

  const goNext = useCallback(() => {
    if (step === 0 && cityId) {
      click();
      setStep(1);
    } else if (step === 1 && era) {
      click();
      setStep(2);
    } else if (step === 2 && moniker.trim()) {
      click();
      setStep(3);
    } else if (step === 3 && era && origin) {
      click();
      onBegin(era, origin.id, { name: moniker.trim(), appearance: look, cityId });
    }
  }, [step, era, origin, moniker, look, cityId, onBegin]);

  const goBack = useCallback(() => {
    click();
    if (step > 0) setStep((current) => (current - 1) as 0 | 1 | 2 | 3);
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
            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-8">
        {/* Header + stepper */}
        <header className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
          <button type="button" onClick={goBack} className="rst-btn rst-btn-ghost shrink-0 justify-self-start whitespace-nowrap !min-h-9 !px-3 !text-xs">
            <ArrowLeft size={14} aria-hidden="true" />
            {step === 0 ? t('career_back') : t(`career_back_to_${STEP_KEYS[step - 1]}`)}
          </button>
          <ol className="flex min-w-0 items-center gap-3 sm:gap-4" aria-label="Career setup progress">
            {STEP_KEYS.map((key, i) => (
              <li key={key} className={stepClass(i === step, i < step)} aria-current={i === step ? 'step' : undefined}>
                <span
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-center text-[10px] leading-none tabular-nums ${
                    i < step ? 'border-[var(--rst-brass-400)] bg-[var(--rst-brass-400)] text-stone-950' : 'border-current'
                  }`}
                >
                  {i < step ? <Check size={11} aria-hidden="true" /> : i + 1}
                </span>
                <span className={i === step ? '' : 'hidden sm:inline'}>{t(`career_step_${key}`)}</span>
              </li>
            ))}
          </ol>
        </header>

        <div className="mt-8 text-center animate-rst-rise" key={step}>
          <p className="rst-kicker">{step === 0 ? 'Chapter one' : step === 1 ? 'Chapter two' : step === 2 ? 'Chapter three' : 'Chapter four'}</p>
          <h1 ref={headingRef} tabIndex={-1} className="rst-title mt-2 text-3xl outline-none sm:text-5xl">
            {step === 0 ? 'Where does your studio open?' : step === 1 ? 'When does your studio open?' : step === 2 ? 'Make the face behind the faders' : 'Who is behind the console?'}
          </h1>
          <p className="rst-body mx-auto mt-3 max-w-2xl text-sm sm:text-base">
            {step === 0
              ? 'Choose your home scene first. Your location sets the currency, local taste, people and surprises.'
              : step === 1
                ? 'Each era changes your gear, your genres, your budget and the industry breathing down your neck.'
                : step === 2
                  ? 'Give your producer a name and a look. You can change every visual detail with the arrows.'
                  : 'Your producer origin gives you a real edge — and a rival who will not let you forget it.'}
          </p>
        </div>

        {step === 1 && (
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
                    <span className="flex items-center justify-between gap-4"><span className="rst-muted">Starting cash</span><b className="min-w-[7.5rem] text-right tabular-nums leading-none text-[var(--rst-money)]">{formatMoney(e.startingMoney, cityId, e.id)}</b></span>
                    <span className="flex items-center justify-between gap-4 tabular-nums"><span className="rst-muted">Currency</span><b data-testid="era-currency">{currencyFor(cityId, e.id).symbol} {currencyFor(cityId, e.id).code}</b></span>
                    <span className="flex items-center justify-between gap-4"><span className="rst-muted">Gear prices</span><b className="min-w-[7.5rem] text-right tabular-nums leading-none">{Math.round(e.equipmentMultiplier * 100)}% of modern</b></span>
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

        {step === 0 && (
          <section className="mx-auto mt-6 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Choose a home location" data-testid="location-picker">
            {CITIES.map((c, index) => {
              const Icon = CITY_ICONS[c.id];
              const selected = c.id === cityId;
              return (
                <button key={c.id} type="button" role="radio" aria-checked={selected} tabIndex={selected || (!cityId && index === 0) ? 0 : -1}
                  onClick={() => { click(); setCityId(c.id); }}
                  className={`rst-option group relative flex flex-col gap-3 !p-5 text-left animate-rst-rise ${selected ? 'ring-2 ring-[var(--rst-brass-300)]/70' : ''}`}>
                  <span className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--rst-line-strong)] bg-black/25" style={{ color: c.accent }}><Icon aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="rst-title block text-lg">{c.name}</span><span className="block text-xs text-stone-400">{c.country} · {c.currency.symbol} {c.currency.code}</span></span>
                  </span>
                  <span className="rst-body text-xs leading-relaxed">{cityText(c).tagline}</span>
                  <span className="mt-auto border-t border-[var(--rst-line)] pt-3 text-[11px] leading-relaxed text-stone-300">{describeCity(c, eraId).map((line) => <span key={line} className="block">{line}</span>)}</span>
                  {selected && <span className="absolute -top-2 right-4 rounded-full bg-[var(--rst-brass-300)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-stone-950">Selected</span>}
                </button>
              );
            })}
          </section>
        )}

        {step === 2 && (
          <ProducerCreator moniker={moniker} onMoniker={setMoniker} look={look} npc={previewNpc} onPatch={patchLook} onRandomise={randomise} />
        )}

        {step === 3 && (
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
          <p className="min-w-0 basis-full text-xs text-stone-300 sm:flex-1 sm:basis-0" aria-live="polite">
            {era ? <b className="text-[var(--rst-brass-200)]">{era.displayName}</b> : <span className="text-stone-500">No era chosen</span>}
            <span className="mx-2 text-stone-600">·</span>
            <b className="text-[var(--rst-brass-200)]">{moniker || 'Unnamed producer'}</b>
            <span className="mx-2 text-stone-600">·</span>
            <b className="text-[var(--rst-brass-200)]">{getCityById(cityId)?.name}</b>
            <span className="mx-2 text-stone-600">·</span>
            {origin ? <b className="text-[var(--rst-brass-200)]">{origin.name}</b> : <span className="text-stone-500">No role chosen</span>}
            {era && <span className="ml-2 text-stone-500">{formatMoney(era.startingMoney, cityId, era.id)} to start</span>}
            {rival && <span className="ml-2 hidden text-stone-500 sm:inline">· facing {rival.headProducer}</span>}
          </p>
          <button
            type="button"
            className="rst-btn rst-btn-primary min-w-44"
            disabled={step === 0 ? !cityId : step === 1 ? !era : step === 2 ? !moniker.trim() : !(era && origin)}
            onClick={goNext}
          >
            {[t('career_next_era'), t('career_next_character'), t('career_next_role'), t('career_open_studio')][step]}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </main>
  );
}
