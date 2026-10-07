import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Globe2, Landmark, MapPin, Radio, Swords, Waves, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_ERAS, eraDecadeLabel } from '@/data/eras';
import type { Era } from '@/types/game';
import type { ProducerBackgroundId } from '@/types/character';
import { PRODUCER_ORIGINS } from '@/narrative/characterOrigins';
import { describeOriginPerks } from '@/narrative/originPerks';
import { buildRivalIntro } from '@/narrative/storyContractBrief';
import { getPrimaryRival, getRivalAccent, initialsOf } from '@/narrative/rivalCast';
import { THEME_VISUAL_CONFIGS } from '@/narrative/playstyleTheme';
import { gameAudio } from '@/utils/audioSystem';
import {
  DEFAULT_PRODUCER_APPEARANCE,
  buildProducerNpc,
  randomiseProducerAppearance,
  type ProducerAppearance,
} from '@/features/sprites/producerAppearance';
import { createSeededRandom } from '@/simulation/seededRandom';
import { useContentLocale } from '@/i18n/content';
import { CITIES, cityText, currencyFor, getCityById, localName, type CityId } from '@/rpg/cities';
import { SETUP_SURFACES, defaultCareerSetup, isSetupValid, isSurfaceReady, openingBrief, quickStartSetup, type SetupSurface } from '@/rpg/careerSetup';
import { ProducerCreator } from '@/components/ProducerCreator';
import { GamepadNavProvider, useGamepadNav } from '@/contexts/GamepadNavContext';
import './splash.css';

/** The producer the player made on this screen: name + sprite look (persisted as ProducerCustomization). */
export interface ProducerSetup {
  name: string;
  appearance: ProducerAppearance;
  /** Home city: currency display, regional taste, local names and events. */
  cityId?: CityId;
  /** Experienced Producer start (#260): all console techniques unlocked from the first session. */
  experienced?: boolean;
}

interface CareerStartScreenProps {
  onBegin: (era: Era, originId: ProducerBackgroundId, producer: ProducerSetup) => void;
  onBack: () => void;
}

const DIFFICULTY_PIPS: Record<Era['difficulty'], number> = { Easy: 1, Medium: 2, Hard: 3, Legendary: 4 };

const CITY_ICONS: Record<CityId, typeof Radio> = { 'los-angeles': Radio, nashville: Waves, london: Landmark, berlin: Building2, tokyo: Globe2, rio: MapPin, detroit: Building2, lagos: Waves };

const ERAS_OLDEST_FIRST = [...AVAILABLE_ERAS].sort((a, b) => a.startYear - b.startYear);

/**
 * New career setup (#204): two surfaces, not four pages.
 *   place  - city + era, compared side by side with a live "opening brief"
 *   person - name + look + origin
 * Every choice has a valid default, so Quick start (or just Continue, Open the studio) always works.
 */
function CareerStartScreenInner({ onBegin, onBack }: CareerStartScreenProps) {
  const { t } = useTranslation();
  useContentLocale();
  const defaults = useMemo(defaultCareerSetup, []);
  const [surface, setSurface] = useState<SetupSurface>('place');
  const [eraId, setEraId] = useState<string>(defaults.eraId);
  const [originId, setOriginId] = useState<ProducerBackgroundId>(defaults.originId);
  const [experienced, setExperienced] = useState(false);
  const [moniker, setMoniker] = useState(defaults.name);
  const [cityId, setCityId] = useState<CityId>(defaults.cityId);
  const [look, setLook] = useState<ProducerAppearance>(() => ({
    ...DEFAULT_PRODUCER_APPEARANCE,
    seed: Math.floor(Math.random() * 100000), // UI-only roll of the body; persisted once chosen
  }));
  const click = () => void gameAudio.playClick().catch(() => {});

  /** "Surprise me": a local name and a fresh look. UI-only rolls; the chosen result is what persists. */
  const randomise = () => {
    click();
    const rng = createSeededRandom(Math.floor(Math.random() * 0xffffffff));
    const local = localName(cityId, rng(), rng());
    if (local) setMoniker(local.slice(0, 24));
    setLook(randomiseProducerAppearance(rng));
  };
  const changeLook = (next: ProducerAppearance) => {
    click();
    setLook(next);
  };

  const headingRef = useRef<HTMLHeadingElement>(null);
  const era = useMemo(() => AVAILABLE_ERAS.find((e) => e.id === eraId) ?? null, [eraId]);
  const previewNpc = useMemo(() => buildProducerNpc(look, moniker, eraId), [look, moniker, eraId]);
  const origin = useMemo(() => PRODUCER_ORIGINS.find((o) => o.id === originId) ?? null, [originId]);
  const brief = useMemo(() => openingBrief(cityId, eraId), [cityId, eraId]);
  const city = getCityById(cityId);
  const choices = { cityId, eraId, originId, name: moniker };

  const open = useCallback(() => {
    if (!era || !origin || !isSetupValid({ cityId, eraId, originId, name: moniker })) return;
    click();
    onBegin(era, origin.id, { name: moniker.trim(), appearance: look, cityId, ...(experienced ? { experienced: true } : {}) });
  }, [era, origin, moniker, look, cityId, eraId, originId, experienced, onBegin]);

  /** Fast path: a seeded, valid studio and producer; straight into the move-in transition. */
  const quickStart = () => {
    click();
    const rng = createSeededRandom(Math.floor(Math.random() * 0xffffffff));
    const pick = quickStartSetup(rng);
    const pickedEra = AVAILABLE_ERAS.find((e) => e.id === pick.eraId);
    if (!pickedEra) return;
    onBegin(pickedEra, pick.originId, { name: pick.name, appearance: randomiseProducerAppearance(rng), cityId: pick.cityId });
  };

  const goNext = useCallback(() => {
    if (surface === 'place') {
      if (isSurfaceReady('place', { cityId, eraId, originId, name: moniker })) {
        click();
        setSurface('person');
      }
    } else open();
  }, [surface, cityId, eraId, originId, moniker, open]);

  const goBack = useCallback(() => {
    click();
    if (surface === 'person') setSurface('place');
    else onBack();
  }, [surface, onBack]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [surface]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goBack();
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'INPUT' && (e.target as HTMLElement).getAttribute('role') !== 'spinbutton') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack, goNext]);

  // Controller: B/East goes back; X/West is Surprise me on the person surface. D-pad/stick traversal, A and
  // left/right adjustment come from the shared GamepadNavProvider (see data-gamepad-* attributes).
  const { registerShortcut } = useGamepadNav();
  const randomiseRef = useRef(randomise);
  randomiseRef.current = randomise;
  useEffect(() => registerShortcut('east', goBack), [registerShortcut, goBack]);
  useEffect(() => (surface === 'person' ? registerShortcut('west', () => randomiseRef.current()) : undefined), [registerShortcut, surface]);

  /** Arrow keys move the selection inside a radiogroup, as native radios would. */
  const arrowSelect = <T extends string>(items: readonly T[], current: T | null, set: (v: T) => void) =>
    (e: React.KeyboardEvent) => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const i = current ? items.indexOf(current) : -1;
      set(items[(i + dir + items.length) % items.length]);
      // Roving tabindex: move DOM focus with the selection.
      const group = e.currentTarget as HTMLElement;
      requestAnimationFrame(() => group.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus());
    };

  const rival = origin ? getPrimaryRival(origin.primaryPlaystyle) : null;
  const rivalIntro = rival ? buildRivalIntro(rival) : null;
  const surfaceIndex = SETUP_SURFACES.indexOf(surface);

  return (
    <main className={`career-start-page${surface === 'person' ? ' career-character-step' : ''}`} aria-label={t('career_aria')} data-surface={surface} data-gamepad-scope>
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col pb-28 pl-[max(1rem,var(--rst-safe-left))] pr-[max(1rem,var(--rst-safe-right))] pt-[var(--rst-top-inset)] sm:pl-[max(2rem,var(--rst-safe-left))] sm:pr-[max(2rem,var(--rst-safe-right))] sm:pt-[max(1.5rem,var(--rst-top-inset))]">
        <header className="flex items-center justify-between gap-3">
          <button type="button" onClick={goBack} className="rst-btn rst-btn-ghost rst-top-action shrink-0 whitespace-nowrap !px-3 !text-xs">
            <ArrowLeft size={14} aria-hidden="true" />
            {surface === 'place' ? t('career_back') : t('career_where_when')}
          </button>
          <button type="button" onClick={quickStart} data-testid="quick-start" className="rst-btn rst-btn-ghost rst-top-action shrink-0 whitespace-nowrap !px-3 !text-xs">
            <Zap size={14} aria-hidden="true" />
            {t('career_quick_start')}
          </button>
        </header>

        <div className="mt-6 text-center animate-rst-rise" key={surface}>
          <p className="rst-kicker">{t('career_kicker')}</p>
          <h1 ref={headingRef} tabIndex={-1} className="rst-title mt-2 text-3xl outline-none sm:text-5xl">
            {surface === 'place' ? t('career_title_place') : t('career_title_person')}
          </h1>
        </div>

        {surface === 'place' && (
          <>
            <section className="mx-auto mt-6 grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Choose a home city" data-testid="location-picker"
              onKeyDown={arrowSelect<CityId>(CITIES.map((c) => c.id), cityId, setCityId)}>
              {CITIES.map((c) => {
                const Icon = CITY_ICONS[c.id];
                const selected = c.id === cityId;
                return (
                  <button key={c.id} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1}
                    onClick={() => { click(); setCityId(c.id); }}
                    className={`rst-option relative flex flex-col gap-1.5 !p-3 text-left ${selected ? 'ring-2 ring-[var(--rst-brass-300)]/80' : ''}`}
                    style={selected ? { borderColor: c.accent } : undefined}>
                    <span className="flex items-center gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--rst-line-strong)] bg-black/25" style={{ color: c.accent }}><Icon size={16} aria-hidden="true" /></span>
                      <span className="min-w-0"><span className="rst-title block truncate text-base">{c.name}</span><span className="block truncate text-[11px] text-stone-400">{c.country}</span></span>
                    </span>
                    <span className="rst-body text-[11px] leading-snug">{cityText(c).tagline}</span>
                    {selected && <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-[var(--rst-brass-300)] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-stone-950"><Check size={10} aria-hidden="true" />Selected</span>}
                  </button>
                );
              })}
            </section>

            <div className="mx-auto mt-5 grid w-full max-w-5xl grid-cols-4 gap-2 sm:gap-3" role="radiogroup" aria-label="Choose an era" data-testid="era-picker"
              onKeyDown={arrowSelect(ERAS_OLDEST_FIRST.map((e) => e.id), eraId, setEraId)}>
              {ERAS_OLDEST_FIRST.map((e) => {
                const selected = e.id === eraId;
                return (
                  <button key={e.id} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1}
                    onClick={() => { click(); setEraId(e.id); }}
                    className={`rst-option relative flex flex-col items-center gap-1 !p-2.5 text-center ${selected ? 'ring-2 ring-[var(--rst-brass-300)]/80' : ''}`}>
                    <span className="rst-title text-lg tabular-nums sm:text-xl">{eraDecadeLabel(e.startYear)}</span>
                    <span className="hidden text-[11px] text-stone-400 sm:block">{e.displayName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300">
                      {e.difficulty}
                      <span className="ml-1.5 inline-flex gap-0.5 align-middle" aria-hidden="true">
                        {[0, 1, 2, 3].map((i) => <span key={i} className="h-1.5 w-2 rounded-full" style={{ background: i < DIFFICULTY_PIPS[e.difficulty] ? 'var(--rst-brass-300)' : 'rgba(243,236,221,0.12)' }} />)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {brief && city && era && (
              <section aria-live="polite" data-testid="opening-brief" className="mx-auto mt-5 w-full max-w-5xl rounded-xl border bg-black/30 p-4 sm:p-5" style={{ borderColor: brief.accent }}>
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                  <h2 className="rst-title text-xl tracking-wide sm:text-2xl" style={{ color: brief.accent }}>{brief.headline}</h2>
                  <p className="text-sm text-stone-300">Starting cash <b data-testid="starting-cash" className="tabular-nums text-[var(--rst-money)]">{brief.startingCash}</b> <span className="text-stone-500" data-testid="era-currency">{currencyFor(cityId, eraId).symbol} {brief.currencyCode}</span></p>
                </div>
                <p className="rst-body mt-2 text-sm">{cityText(city).tagline} Local edge: +1 {cityText(city).edgeLabel}.</p>
                <p className="mt-1 text-sm text-stone-300">{brief.challenge} Gear at {Math.round(era.equipmentMultiplier * 100)}% of modern prices.</p>
              </section>
            )}
          </>
        )}

        {surface === 'person' && (
          <>
            <ProducerCreator moniker={moniker} onMoniker={setMoniker} look={look} npc={previewNpc} onLookChange={changeLook} onRandomise={randomise} />
            <div
              role="radiogroup"
              aria-label="Choose a producer origin"
              data-testid="origin-picker"
              onKeyDown={arrowSelect<ProducerBackgroundId>(PRODUCER_ORIGINS.map((o) => o.id), originId, setOriginId)}
              className="mx-auto mt-6 grid w-full max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {PRODUCER_ORIGINS.map((o) => {
                const theme = THEME_VISUAL_CONFIGS[o.preferredTheme];
                const selected = o.id === originId;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => { click(); setOriginId(o.id); }}
                    className="rst-option relative flex flex-col gap-1.5 !p-3 text-left"
                    style={selected ? { borderColor: theme.primaryColor, boxShadow: `0 0 0 1px ${theme.primaryColor} inset, 0 0 24px ${theme.primaryColor}2b` } : undefined}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="rst-serif grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
                        {initialsOf(o.name.replace(/^The /, ''))}
                      </span>
                      <span className="min-w-0">
                        <span className="rst-title block truncate text-base">{o.name}</span>
                        <span className="block text-[11px] leading-snug text-stone-400">{o.tagline}</span>
                      </span>
                    </span>
                    <span className="flex gap-1.5 text-[11px] leading-snug text-stone-200">
                      <Check size={12} className="mt-0.5 shrink-0 text-[var(--rst-money)]" aria-hidden="true" />
                      {describeOriginPerks(o.id)[0]}
                    </span>
                    {selected && (
                      <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-stone-950" style={{ background: theme.primaryColor }}>
                        <Check size={10} aria-hidden="true" />Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {origin && rival && (
              <section aria-live="polite" data-testid="origin-detail" className="mx-auto mt-4 w-full max-w-5xl rounded-xl border border-[var(--rst-line)] bg-black/25 p-4 text-sm">
                <p className="rst-body">{origin.lore}</p>
                <ul className="mt-2 space-y-1 text-xs text-stone-200">
                  {describeOriginPerks(origin.id).map((line) => (
                    <li key={line} className="flex gap-1.5"><Check size={12} className="mt-0.5 shrink-0 text-[var(--rst-money)]" aria-hidden="true" />{line}</li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-stone-400" data-testid="rival-intro">
                  <p className="flex items-start gap-2">
                    <Swords size={13} className="mt-0.5 shrink-0" style={{ color: getRivalAccent(rival.id) }} aria-hidden="true" />
                    <span>Rival: <b className="text-stone-200" data-testid="rival-intro-headline">{rivalIntro?.headline}</b></span>
                  </p>
                  <p className="mt-0.5 pl-[21px] italic text-stone-300" data-testid="rival-intro-catchphrase">{rivalIntro?.catchphrase}</p>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Sticky footer: the summary + the one primary action */}
        {surface === 'person' && (
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--rst-line)] bg-black/25 p-3 text-xs text-stone-200">
            <input
              type="checkbox"
              data-testid="experienced-producer"
              checked={experienced}
              onChange={(e) => { click(); setExperienced(e.target.checked); }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--rst-brass-300)]"
            />
            <span>
              <b className="block text-[var(--rst-brass-200)]">Experienced Producer</b>
              Skip the lessons: Overdrive, Combo and Streak Bank are available from the first session. Money, gear and rooms still start the same.
            </span>
          </label>
        )}

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--rst-line-strong)] bg-[rgba(14,12,10,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <p className="min-w-0 basis-full text-xs text-stone-300 sm:flex-1 sm:basis-0" aria-live="polite">
            <b className="text-[var(--rst-brass-200)]">{city?.name}</b>
            <span className="mx-2 text-stone-600">·</span>
            <b className="text-[var(--rst-brass-200)]">{era?.displayName}</b>
            <span className="mx-2 text-stone-600">·</span>
            <b className="text-[var(--rst-brass-200)]">{moniker || 'Unnamed producer'}</b>
            <span className="mx-2 text-stone-600">·</span>
            <b className="text-[var(--rst-brass-200)]">{origin?.name}</b>
          </p>
          <span className="sr-only">Step {surfaceIndex + 1} of {SETUP_SURFACES.length}</span>
          <button
            type="button"
            className="rst-btn rst-btn-primary min-w-44"
            data-testid="setup-cta"
            disabled={!isSurfaceReady(surface, choices)}
            onClick={goNext}
          >
            {surface === 'place' ? t('career_continue') : t('career_open_studio')}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </main>
  );
}

/** The career-start flow owns controller focus: the shared nav provider scopes D-pad traversal to this screen. */
export function CareerStartScreen(props: CareerStartScreenProps) {
  return (
    <GamepadNavProvider>
      <CareerStartScreenInner {...props} />
    </GamepadNavProvider>
  );
}
