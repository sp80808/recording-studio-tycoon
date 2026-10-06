import { money } from '@/utils/displayMoney';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { nextTechniqueTease } from '@/rpg/featureUnlocks';
import { EMPTY_STATES } from '@/data/flavour';
import { ArrowRight, BookOpen, Pin, Check, ChevronDown, Circle, Feather, Flag, Scroll, Sparkles, Swords, Target, Zap } from 'lucide-react';
import { GameState } from '@/types/game';
import { checkDailyChallenge } from '@/utils/dailyChallenges';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { calculateEquipmentUpkeep } from '@/hooks/useGameActions';
import { getOriginEffects } from '@/narrative/originPerks';
import { gameAudio } from '@/utils/audioSystem';
import { resolveCareerNextAction } from '@/utils/careerNextAction';
import { careerTitle, deriveBranchConsequences, deriveCareerCast, deriveCareerMilestones, deriveSelectedCredits, deriveKnownFor, groupMilestonesByChapter, resolveCareerChapter, resolveCareerTarget, resolvePinnedMoments, type CareerMilestone } from '@/utils/careerChronicle';
import { deriveEarnedTitles, deriveKeepsakes } from '@/utils/careerRewards';
import { getProducerOrigin } from '@/narrative/characterOrigins';
import { getRivalAccent, getRivalForNode, initialsOf } from '@/narrative/rivalCast';
import type { ProducerBackgroundId } from '@/types/character';
import { AchievementsPanel } from './AchievementsPanel';
import { LedgerPanel } from './LedgerPanel';
import { SeasonPanel } from './SeasonPanel';
import type { StudioFocus } from '@/rpg/studioSeasons';
import {
  getActiveCampaignNode,
  getPendingSubplotEvent,
  getStorylineObjectiveProgress,
  hasPendingStorylineBranch,
  type ChronicleKind,
} from '@/narrative/branchingStorylineEngine';

interface CareerHubProps {
  gameState: GameState;
  onTalents: () => void;
  onWork: () => void;
  onBookings: () => void;
  onRest: () => void;
  onStaff: () => void;
  /** Open StorylineBranchModal when a pending Act choice exists. */
  onOpenStorylineBranch?: () => void;
  /** Reopen a subplot decision the player postponed. */
  onOpenStoryEvent?: () => void;
  /** Choose the Studio Season focus (#63). */
  onChooseSeasonFocus?: (focus: StudioFocus) => void;
  /** Pin or unpin a defining moment (max 3). Omitted = read-only. */
  onTogglePinnedMoment?: (id: string) => void;
}

const CHRONICLE_ICON: Record<ChronicleKind, typeof Scroll> = { campaign: Flag, subplot: Feather, ending: Scroll, event: Sparkles };

/** XP ring around the level number. Decorative: the numeric XP text carries the meaning. */
function LevelBadge({ level, ratio }: { level: number; ratio: number }) {
  const r = 27;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid h-[68px] w-[68px] shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 68 68" className="absolute inset-0 -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(243,236,221,0.10)" strokeWidth="4" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="var(--rst-brass-400)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, ratio)))}
          style={{ transition: 'stroke-dashoffset .6s var(--rst-ease)', filter: 'drop-shadow(0 0 6px rgba(230,184,102,.45))' }}
        />
      </svg>
      <span key={level} className="rst-serif text-2xl font-bold text-[var(--rst-brass-200)] motion-safe:animate-in motion-safe:zoom-in">
        {level}
      </span>
    </span>
  );
}

export function CareerHub({
  gameState,
  onTalents,
  onWork,
  onBookings,
  onRest,
  onStaff,
  onOpenStorylineBranch,
  onOpenStoryEvent,
  onChooseSeasonFocus,
  onTogglePinnedMoment,
}: CareerHubProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [storyLogOpen, setStoryLogOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const player = gameState.playerData;
  const challenge = checkDailyChallenge(gameState);
  const claimed =
    gameState.dailyTracking?.day === gameState.currentDay &&
    gameState.dailyTracking?.challengeDoneId === challenge.def.id;
  const next = ProgressionSystem.getNextUnlockRequirements(gameState);
  const expenses =
    calculateEquipmentUpkeep(gameState.ownedEquipment, getOriginEffects(gameState)) +
    gameState.hiredStaff.reduce((sum, staff) => sum + staff.salary, 0);
  const origin = player.originId ? getProducerOrigin(player.originId as ProducerBackgroundId) : null;
  const xpRatio = player.xp / Math.max(1, player.xpToNextLevel);

  const activeNode = useMemo(() => getActiveCampaignNode(gameState), [gameState]);
  const objectiveProgress = useMemo(
    () => (activeNode ? getStorylineObjectiveProgress(activeNode, gameState) : null),
    [activeNode, gameState],
  );
  const pendingBranch = hasPendingStorylineBranch(gameState);
  const story = gameState.storylineState;
  const campaignDone = Boolean(story?.campaignCompleted);
  const pendingEvent = getPendingSubplotEvent(gameState);
  const chronicle = [...(story?.chronicle ?? [])].reverse();
  const rival = activeNode ? getRivalForNode(activeNode.id, player.playstyle) : null;
  const rivalAccent = rival ? getRivalAccent(rival.id) : '#e6b866';

  const knownFor = useMemo(() => deriveKnownFor(gameState), [gameState]);
  const milestones = useMemo(() => deriveCareerMilestones(gameState).slice(-3).reverse(), [gameState]);
  const chapter = useMemo(() => resolveCareerChapter(gameState), [gameState]);
  const chapterGroups = useMemo(() => groupMilestonesByChapter(gameState), [gameState]);
  const pinned = useMemo(() => resolvePinnedMoments(gameState), [gameState]);
  const cast = useMemo(() => deriveCareerCast(gameState), [gameState]);
  const credits = useMemo(() => deriveSelectedCredits(gameState), [gameState]);
  const earnedTitles = useMemo(() => deriveEarnedTitles(gameState), [gameState]);
  const keepsakes = useMemo(() => deriveKeepsakes(gameState).slice(-4).reverse(), [gameState]);
  const consequences = useMemo(() => deriveBranchConsequences(gameState), [gameState]);
  const pinnedIds = new Set(pinned.map((m) => m.id));
  const pinButton = (m: CareerMilestone) =>
    onTogglePinnedMoment && (
      <button
        type="button"
        onClick={() => {
          click();
          onTogglePinnedMoment(m.id);
        }}
        aria-pressed={pinnedIds.has(m.id)}
        aria-label={`${pinnedIds.has(m.id) ? 'Unpin' : 'Pin'} ${m.title}`}
        className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-md ${pinnedIds.has(m.id) ? 'text-[var(--rst-brass-300)]' : 'text-stone-600 hover:text-stone-300'}`}
      >
        <Pin size={13} className={pinnedIds.has(m.id) ? 'fill-current' : ''} aria-hidden="true" />
      </button>
    );
  const careerTarget = useMemo(() => resolveCareerTarget(gameState), [gameState]);
  const producerName = gameState.producerCustomization?.name || player.name;

  const resolved = resolveCareerNextAction(gameState, ` · ${money(expenses)} daily costs`);
  const nextAction = {
    ...resolved,
    action: resolved.type === 'rest' ? onRest : resolved.type === 'book' ? onBookings : onWork,
  };

  const tease = useMemo(() => nextTechniqueTease(gameState), [gameState]);
  const click = () => void gameAudio.playClick().catch(() => {});

  return (
    <section aria-label="Producer career" className="space-y-3 p-1 text-stone-100">
      {/* Producer card */}
      <button
        onClick={onTalents}
        className="rst-surface group flex w-full items-center gap-4 p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--rst-brass-300)]"
      >
        <LevelBadge level={player.level} ratio={xpRatio} />
        <span className="min-w-0 flex-1">
          <span className="rst-kicker block truncate">{origin ? origin.name : 'Your producer story'}</span>
          <span className="rst-title mt-0.5 block truncate text-xl">
            {producerName ? `${producerName} — ` : ''}
            {careerTitle(player.level)}
          </span>
          <span className="mt-1 block text-xs leading-snug text-stone-300">{knownFor.line}</span>
          <span
            className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Producer XP"
            aria-valuemin={0}
            aria-valuemax={player.xpToNextLevel}
            aria-valuenow={player.xp}
          >
            <span
              className="block h-full rounded-full bg-[var(--rst-brass-400)] motion-safe:transition-all motion-safe:duration-500"
              style={{ width: `${Math.min(100, xpRatio * 100)}%` }}
            />
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums text-stone-400">
            <span>
              {player.xp}/{player.xpToNextLevel} XP
            </span>
            {player.perkPoints > 0 ? (
              <span className="rst-chip rst-chip-brass">
                <Sparkles size={11} aria-hidden="true" />
                {player.perkPoints} talent point{player.perkPoints === 1 ? '' : 's'} to spend
              </span>
            ) : (
              <span className="text-stone-500 group-hover:text-stone-300">View producer talents →</span>
            )}
          </span>
        </span>
      </button>

      <SeasonPanel gameState={gameState} onChooseFocus={onChooseSeasonFocus} />

      {tease && (
        <p data-testid="technique-tease" className="rst-surface flex items-start gap-2 p-3 text-xs leading-snug text-stone-300">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
          <span>
            <span className="font-semibold text-stone-100">{t('technique_tease_title')}</span>{' '}
            {t(`technique_tease_${tease.feature}`)}
          </span>
        </p>
      )}

      {/* Next action */}
      <div className="rst-surface flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1 basis-40">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--rst-live)]">
            <Zap size={14} aria-hidden="true" />
            {player.dailyWorkCapacity} sessions left today
          </p>
          <p className="mt-1 text-xs text-stone-400">{nextAction.subtext}</p>
          <p className="mt-2 text-xs text-stone-300" data-testid="career-target">
            <span className="rst-kicker mr-1.5">Ambition</span>
            {careerTarget.label}
            <span className="block text-stone-500">{careerTarget.detail}</span>
          </p>
        </div>
        <button onClick={nextAction.action} className="rst-btn rst-btn-primary">
          {nextAction.label}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {/* Your story so far: chapter, pinned moments, branch consequences, derived firsts. Never routine sessions. */}
      <div className="rst-surface p-4 text-xs" aria-label="Your story so far" data-testid="career-chapter">
        <p className="rst-kicker mb-1">Current chapter</p>
        <p className="rst-title text-base">{chapter.title}</p>
        <p className="mt-0.5 text-stone-400">{chapter.blurb}</p>

        {pinned.length > 0 && (
          <div className="mt-3" data-testid="pinned-moments">
            <p className="rst-kicker mb-1.5">Defining moments</p>
            <ul className="space-y-1.5">
              {pinned.map((m) => (
                <li key={m.id} className="flex items-start gap-2">
                  <Pin size={12} className="mt-0.5 shrink-0 fill-current text-[var(--rst-brass-300)]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="text-stone-200">{m.title}</span>
                    <span className="block text-stone-500">{m.detail}</span>
                  </span>
                  {pinButton(m)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {consequences.length > 0 && (
          <div className="mt-3" data-testid="branch-consequences">
            <p className="rst-kicker mb-1.5">What changed because of you</p>
            <ul className="space-y-1.5">
              {consequences.map((c) => (
                <li key={`${c.nodeId}-${c.day}`} className="flex gap-2">
                  <Flag size={12} className="mt-0.5 shrink-0 text-[var(--rst-story)]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="text-stone-200">{c.headline}</span>
                    <span className="block text-stone-500">{c.outcome}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {milestones.length > 0 && (
          <div className="mt-3">
            <p className="rst-kicker mb-1.5">Recent</p>
            <ul className="space-y-1.5">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-2">
                  <Flag size={12} className="mt-0.5 shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="text-stone-200">{m.title}</span>
                    <span className="block text-stone-500">{m.detail}</span>
                  </span>
                  {pinButton(m)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(cast.length > 0 || credits.length > 0) && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="career-cast-credits">
            {cast.length > 0 && (
              <div data-testid="career-cast">
                <p className="rst-kicker mb-1.5">Cast of your career</p>
                <ul className="space-y-1.5">
                  {cast.map((c) => (
                    <li key={c.id}>
                      <span className="text-stone-200">{c.name}</span>
                      <span className="block text-stone-500">{c.role}. {c.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {credits.length > 0 && (
              <div data-testid="career-credits">
                <p className="rst-kicker mb-1.5">Selected credits</p>
                <ul className="space-y-1.5">
                  {credits.map((c) => (
                    <li key={c.id}>
                      <span className="text-stone-200">{c.title}</span>
                      <span className="block text-stone-500">{c.label}. {c.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {earnedTitles.length > 0 && (
          <div className="mt-3" data-testid="career-titles">
            <p className="rst-kicker mb-1.5">{t('career_titles_kicker')}</p>
            <p className="text-stone-200" data-testid="career-current-title">
              {t('career_title_current', { title: t(`career_title_${earnedTitles[earnedTitles.length - 1].id}`, { defaultValue: earnedTitles[earnedTitles.length - 1].title }) })}
            </p>
            <p className="text-stone-500">{t('career_title_earned_by', { because: earnedTitles[earnedTitles.length - 1].because })}</p>
            {earnedTitles.length > 1 && (
              <p className="mt-1 text-stone-500">
                {t('career_titles_earlier')}:{' '}
                {earnedTitles
                  .slice(0, -1)
                  .reverse()
                  .map((e) => t(`career_title_${e.id}`, { defaultValue: e.title }))
                  .join(' · ')}
              </p>
            )}
            {keepsakes.length > 0 && (
              <ul className="mt-1.5 space-y-1.5" data-testid="career-keepsakes">
                {keepsakes.map((k) => (
                  <li key={k.itemId}>
                    <span className="text-stone-200">{k.name}</span>
                    <span className="block text-stone-500">
                      {t(k.kind === 'furnishing' ? 'career_keepsake_furnishing' : 'career_keepsake_cosmetic')}. {k.provenance}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {chapterGroups.some((g) => g.milestones.length > 0) && (
          <>
            <button
              type="button"
              onClick={() => {
                click();
                setChaptersOpen((prev) => !prev);
              }}
              className="rst-btn rst-btn-ghost mt-3 !min-h-9 !px-3 !text-xs"
              aria-expanded={chaptersOpen}
            >
              <BookOpen size={13} aria-hidden="true" />
              All chapters
              <ChevronDown size={13} className={`transition-transform duration-200 ${chaptersOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {chaptersOpen && (
              <ol className="mt-2 space-y-3 border-t border-[var(--rst-line)] pt-3" data-testid="chapter-list">
                {chapterGroups.map((g) => (
                  <li key={g.chapter.id}>
                    <p className="text-stone-200">
                      {g.chapter.title}
                      {g.current && <span className="rst-chip rst-chip-brass ml-2">Now</span>}
                    </p>
                    {g.milestones.length === 0 ? (
                      <p className="text-stone-500">{g.chapter.blurb}</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {g.milestones.map((m) => (
                          <li key={m.id} className="flex items-start gap-2">
                            <span className="min-w-0 text-stone-400">
                              {m.title}
                              <span className="block text-stone-500">{m.detail}</span>
                            </span>
                            {pinButton(m)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      {/* Campaign */}
      {activeNode && story && (
        <div className="rst-surface overflow-hidden text-xs">
          <div className="flex items-start gap-3 p-4">
            <span
              aria-hidden="true"
              className="rst-serif grid h-11 w-11 shrink-0 place-items-center rounded-full border text-sm font-bold"
              style={{ borderColor: `${rivalAccent}66`, color: rivalAccent, background: `${rivalAccent}14` }}
            >
              {rival ? initialsOf(rival.headProducer) : <Swords size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="rst-kicker">{campaignDone ? 'Campaign complete' : `Act ${activeNode.act} · ${rival?.name ?? 'Rival'}`}</p>
              <p className="rst-title mt-0.5 text-base">{activeNode.title.replace(/^Act [IVX]+:\s*/, '')}</p>
              {!campaignDone && objectiveProgress && (
                <ul className="mt-2.5 space-y-1" aria-label="Campaign objectives">
                  {objectiveProgress.requirements.map((req) => (
                    <li key={req.id} className="flex items-center gap-2">
                      {req.done ? (
                        <Check size={13} className="shrink-0 text-[var(--rst-money)]" aria-label="Done" />
                      ) : (
                        <Circle size={13} className="shrink-0 text-stone-600" aria-label="Not yet" />
                      )}
                      <span className={`tabular-nums ${req.done ? 'text-[var(--rst-money)]' : 'text-stone-300'}`}>{req.label}</span>
                    </li>
                  ))}
                  {pendingBranch && (
                    <li className="pt-1 font-semibold text-[var(--rst-money)]">Objective met — choose your path</li>
                  )}
                </ul>
              )}
              {!campaignDone && <p className="mt-2 leading-relaxed text-stone-500">{activeNode.objectiveDescription}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--rst-line)] bg-black/20 px-4 py-2.5">
            {pendingBranch && onOpenStorylineBranch && (
              <button
                type="button"
                onClick={() => {
                  click();
                  onOpenStorylineBranch();
                }}
                className="rst-btn rst-btn-primary !min-h-9 !px-3 !text-xs"
              >
                Decide path
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            )}
            {pendingEvent && onOpenStoryEvent && (
              <button
                type="button"
                onClick={() => {
                  click();
                  onOpenStoryEvent();
                }}
                className="rst-btn !min-h-9 !px-3 !text-xs !border-[rgba(196,161,240,0.4)] !text-[var(--rst-story)]"
              >
                <Feather size={13} aria-hidden="true" />
                {pendingEvent.stage.title}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                click();
                setStoryLogOpen((prev) => !prev);
              }}
              className="rst-btn rst-btn-ghost ml-auto !min-h-9 !px-3 !text-xs"
              aria-expanded={storyLogOpen}
            >
              <BookOpen size={13} aria-hidden="true" />
              Story log
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${storyLogOpen ? 'rotate-180 text-[var(--rst-brass-300)]' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {storyLogOpen && (
            <div className="space-y-4 border-t border-[var(--rst-line)] bg-black/25 p-4 animate-rst-rise">
              {rival && (
                <div>
                  <p className="rst-kicker mb-1 !text-[var(--rst-danger)]">Rival foil</p>
                  <p className="text-stone-300">
                    {activeNode.rivalName}: <span className="italic text-stone-400">{activeNode.rivalDialogue}</span>
                  </p>
                </div>
              )}
              <div>
                <p className="rst-kicker mb-1.5">Studio chronicle</p>
                {chronicle.length === 0 ? (
                  <p className="text-stone-400">{EMPTY_STATES.chronicle.title} {EMPTY_STATES.chronicle.hint}</p>
                ) : (
                  <ol className="space-y-2.5">
                    {chronicle.slice(0, 12).map((entry, i) => {
                      const Icon = CHRONICLE_ICON[entry.kind] ?? Flag;
                      return (
                        <li key={`${entry.day}-${entry.title}-${i}`} className="flex gap-2.5">
                          <Icon size={13} className="mt-0.5 shrink-0 text-[var(--rst-brass-300)]" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block text-stone-200">
                              <span className="tabular-nums text-stone-500">Day {entry.day} · </span>
                              {entry.title}
                            </span>
                            <span className="block leading-relaxed text-stone-400">{entry.outcome}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <AchievementsPanel gameState={gameState} />

      {/* Daily goal + expansion */}
      <div className="rst-surface overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => {
            click();
            setExpanded((prev) => !prev);
          }}
          className="flex w-full min-h-11 cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
          aria-expanded={expanded}
        >
          <Target size={14} className={claimed ? 'text-[var(--rst-money)]' : 'text-[var(--rst-brass-400)]'} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-semibold text-stone-100">Daily goal · {challenge.def.description}</span>
          <div
            className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-white/10 sm:block"
            role="progressbar"
            aria-valuenow={challenge.progress}
            aria-valuemax={challenge.def.target}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${claimed ? 'bg-[var(--rst-money)]' : 'bg-[var(--rst-brass-400)]'}`}
              style={{ width: `${Math.min(100, (challenge.progress / Math.max(1, challenge.def.target)) * 100)}%` }}
            />
          </div>
          <span className={`shrink-0 tabular-nums font-medium ${claimed ? 'text-[var(--rst-money)]' : 'text-[var(--rst-brass-300)]'}`}>
            {claimed ? 'Earned ✓' : `${challenge.progress}/${challenge.def.target} · +${money(challenge.def.reward.money)}`}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-stone-400 transition-transform duration-200 ${expanded ? 'rotate-180 text-[var(--rst-brass-300)]' : ''}`}
            aria-hidden="true"
          />
        </button>

        {expanded && (
          <div className="grid gap-4 border-t border-[var(--rst-line)] bg-black/25 p-4 sm:grid-cols-2 animate-rst-rise">
            <div>
              <p className="rst-kicker">{challenge.def.title}</p>
              <p className="mt-1 text-stone-300">
                ${challenge.def.reward.money} · +{challenge.def.reward.reputation} reputation · +{challenge.def.reward.xp} XP
              </p>
              <p className="mt-1 text-stone-400">Rewards arrive automatically as you play. A new goal arrives each day.</p>
            </div>
            <div>
              <p className="rst-kicker">{next ? 'Next studio expansion' : 'Studio fully expanded'}</p>
              {next && (
                <p className="mt-1 text-stone-300">
                  Level {next.currentLevel}/{next.levelNeeded} · Crew {next.currentStaff}/{next.staffNeeded} · Releases{' '}
                  {next.currentProjects}/{next.projectsNeeded}
                </p>
              )}
              {next && (
                <button
                  onClick={onStaff}
                  className="mt-1 min-h-9 font-semibold text-[var(--rst-brass-300)] underline underline-offset-4 hover:text-[var(--rst-brass-200)]"
                >
                  Build your crew →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <LedgerPanel gameState={gameState} />
    </section>
  );
}
