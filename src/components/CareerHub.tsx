import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, Flag, Sparkles, Swords, Target, Zap } from 'lucide-react';
import { GameState } from '@/types/game';
import { checkDailyChallenge } from '@/utils/dailyChallenges';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { calculateEquipmentUpkeep } from '@/hooks/useGameActions';
import { getOriginEffects } from '@/narrative/originPerks';
import { gameAudio } from '@/utils/audioSystem';
import { resolveCareerNextAction } from '@/utils/careerNextAction';
import { getProducerOrigin } from '@/narrative/characterOrigins';
import { getRivalAccent, getRivalForNode, initialsOf } from '@/narrative/rivalCast';
import type { ProducerBackgroundId } from '@/types/character';
import {
  getActiveCampaignNode,
  getStorylineObjectiveProgress,
  hasPendingStorylineBranch,
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
}

const careerTitle = (level: number): string =>
  level >= 12
    ? 'Industry legend'
    : level >= 8
      ? 'Studio visionary'
      : level >= 5
        ? 'Hitmaker'
        : level >= 3
          ? 'Rising producer'
          : 'Independent producer';

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
}: CareerHubProps) {
  const [expanded, setExpanded] = useState(false);
  const [storyLogOpen, setStoryLogOpen] = useState(false);
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
  const storyFlags = story
    ? Object.entries(story.storyFlags).filter(
        ([key, value]) => key !== 'pending_branch_choice' && value !== false,
      )
    : [];
  const rival = activeNode ? getRivalForNode(activeNode.id, player.playstyle) : null;
  const rivalAccent = rival ? getRivalAccent(rival.id) : '#e6b866';

  const resolved = resolveCareerNextAction(gameState, ` · $${expenses} daily costs`);
  const nextAction = {
    ...resolved,
    action: resolved.type === 'rest' ? onRest : resolved.type === 'book' ? onBookings : onWork,
  };

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
          <span className="rst-title mt-0.5 block truncate text-xl">{careerTitle(player.level)}</span>
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

      {/* Next action */}
      <div className="rst-surface flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1 basis-40">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--rst-live)]">
            <Zap size={14} aria-hidden="true" />
            {player.dailyWorkCapacity} sessions left today
          </p>
          <p className="mt-1 text-xs text-stone-400">{nextAction.subtext}</p>
        </div>
        <button onClick={nextAction.action} className="rst-btn rst-btn-primary">
          {nextAction.label}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
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
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <div
                    className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10 sm:w-36"
                    role="progressbar"
                    aria-label="Campaign objective progress"
                    aria-valuemin={0}
                    aria-valuemax={objectiveProgress.target}
                    aria-valuenow={objectiveProgress.current}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pendingBranch || objectiveProgress.complete ? 'bg-[var(--rst-money)]' : 'bg-[var(--rst-brass-400)]'
                      }`}
                      style={{
                        width: `${Math.min(100, (objectiveProgress.current / Math.max(1, objectiveProgress.target)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={`tabular-nums ${pendingBranch || objectiveProgress.complete ? 'text-[var(--rst-money)]' : 'text-stone-300'}`}>
                    {pendingBranch ? 'Objective met — choose your path' : objectiveProgress.label}
                  </span>
                </div>
              )}
              {!campaignDone && <p className="mt-1.5 leading-relaxed text-stone-400">{activeNode.objectiveDescription}</p>}
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
                <p className="rst-kicker mb-1">Branch decisions</p>
                {story.branchHistory.length === 0 ? (
                  <p className="text-stone-400">No branches chosen yet — finish Act 1 to open the first fork.</p>
                ) : (
                  <ul className="space-y-1 text-stone-300">
                    {story.branchHistory.map((entry) => (
                      <li key={`${entry.nodeId}-${entry.chosenOptionId}-${entry.resolvedDay}`}>
                        Day {entry.resolvedDay}: {entry.chosenOptionId.replace(/_/g, ' ')} → flag{' '}
                        <span className="text-[var(--rst-brass-300)]">{entry.storyFlagGranted}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="rst-kicker mb-1.5 flex items-center gap-1.5">
                  <Flag size={12} aria-hidden="true" />
                  Story flags
                </p>
                {storyFlags.length === 0 ? (
                  <p className="text-stone-400">No story flags yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {storyFlags.map(([key, value]) => (
                      <span key={key} className="rst-chip">
                        {key}
                        {typeof value === 'string' || typeof value === 'number' ? `: ${value}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
            {claimed ? 'Earned ✓' : `${challenge.progress}/${challenge.def.target} · +$${challenge.def.reward.money}`}
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
    </section>
  );
}
