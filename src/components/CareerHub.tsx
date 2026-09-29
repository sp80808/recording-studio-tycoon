import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, Flag, Sparkles, Swords, Target, Zap } from 'lucide-react';
import { GameState } from '@/types/game';
import { checkDailyChallenge } from '@/utils/dailyChallenges';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { calculateEquipmentUpkeep } from '@/hooks/useGameActions';
import { gameAudio } from '@/utils/audioSystem';
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
  const project = gameState.activeProject;
  const awaitingReview = Boolean(project?.awaitingReview);
  const tired = player.dailyWorkCapacity <= 0;
  const expenses =
    calculateEquipmentUpkeep(gameState.ownedEquipment) +
    gameState.hiredStaff.reduce((sum, staff) => sum + staff.salary, 0);
  const title =
    player.level >= 12
      ? 'Industry legend'
      : player.level >= 8
        ? 'Studio visionary'
        : player.level >= 5
          ? 'Hitmaker'
          : player.level >= 3
            ? 'Rising producer'
            : 'Independent producer';

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

  const nextAction = (() => {
    if (awaitingReview) {
      return {
        label: 'Review & release',
        subtext: 'Master complete · Ready to review and release',
        action: onWork,
      };
    }
    if (tired) {
      return {
        label: 'Rest & advance day',
        subtext: `Rest restores sessions · $${expenses} daily costs`,
        action: onRest,
      };
    }
    if (project) {
      return {
        label: 'Continue session',
        subtext: project.title,
        action: onWork,
      };
    }
    return {
      label: gameState.completedProjects.length === 0 ? 'Book your first session' : 'Find a gig',
      subtext: 'Your next record starts with a booking.',
      action: onBookings,
    };
  })();

  return (
    <section aria-label="Producer career" className="shrink-0 border-b border-slate-700/70 bg-slate-950/90 px-3 py-3 text-slate-100">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onTalents}
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          <span
            key={player.level}
            className="grid h-11 w-11 shrink-0 place-content-center rounded-xl border border-amber-300/40 bg-amber-300/10 text-lg font-black text-amber-200 motion-safe:animate-in motion-safe:zoom-in"
          >
            {player.level}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-amber-100">{title}</span>
            <span
              className="mt-1 block h-1.5 max-w-48 overflow-hidden rounded-full bg-slate-700"
              role="progressbar"
              aria-label="Producer XP"
              aria-valuemin={0}
              aria-valuemax={player.xpToNextLevel}
              aria-valuenow={player.xp}
            >
              <span
                className="block h-full rounded-full bg-amber-300 motion-safe:transition-all motion-safe:duration-500"
                style={{ width: `${Math.min(100, (player.xp / Math.max(1, player.xpToNextLevel)) * 100)}%` }}
              />
            </span>
            <span className="mt-1 block text-[10px] tabular-nums text-slate-400">
              {player.xp}/{player.xpToNextLevel} XP ·{' '}
              {player.perkPoints > 0 ? `${player.perkPoints} talent points to spend` : 'View producer talents'}
            </span>
          </span>
          {player.perkPoints > 0 && <Sparkles size={18} className="shrink-0 text-amber-300" aria-hidden="true" />}
        </button>
        <div className="min-w-0 flex-1 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-sky-200">
            <Zap size={14} aria-hidden="true" />
            {player.dailyWorkCapacity} sessions left today
          </p>
          <p className="mt-1 truncate text-slate-400">{nextAction.subtext}</p>
        </div>
        <button
          onClick={nextAction.action}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-500/15 px-4 text-xs font-bold text-sky-100 transition-colors hover:bg-sky-500/30 active:bg-sky-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-200"
        >
          {nextAction.label}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {activeNode && story && (
        <div className="mt-2 overflow-hidden rounded-lg border-2 border-amber-700/50 bg-gradient-to-r from-amber-950/40 to-slate-900/80 text-xs shadow-inner">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Swords size={14} className="shrink-0 text-amber-300" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-100">
                {campaignDone ? 'Campaign complete' : `Act ${activeNode.act}`}: {activeNode.title}
              </p>
              {!campaignDone && objectiveProgress && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <div
                    className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800 sm:w-32"
                    role="progressbar"
                    aria-label="Campaign objective progress"
                    aria-valuemin={0}
                    aria-valuemax={objectiveProgress.target}
                    aria-valuenow={objectiveProgress.current}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pendingBranch || objectiveProgress.complete ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (objectiveProgress.current / Math.max(1, objectiveProgress.target)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`tabular-nums ${
                      pendingBranch || objectiveProgress.complete ? 'text-emerald-300' : 'text-amber-200'
                    }`}
                  >
                    {pendingBranch ? 'Objective met — choose your path' : objectiveProgress.label}
                  </span>
                </div>
              )}
              {!campaignDone && (
                <p className="mt-1 truncate text-[10px] text-slate-400">{activeNode.objectiveDescription}</p>
              )}
            </div>
            {pendingBranch && onOpenStorylineBranch && (
              <button
                type="button"
                onClick={() => {
                  void gameAudio.playClick().catch(() => {});
                  onOpenStorylineBranch();
                }}
                className="flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 text-[11px] font-bold text-rose-100 transition-colors hover:bg-rose-500/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-200"
              >
                Decide path
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                void gameAudio.playClick().catch(() => {});
                setStoryLogOpen((prev) => !prev);
              }}
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-900/80 px-2.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
              aria-expanded={storyLogOpen}
            >
              <BookOpen size={13} aria-hidden="true" />
              Story log
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${storyLogOpen ? 'rotate-180 text-amber-300' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {storyLogOpen && (
            <div className="space-y-3 border-t border-amber-900/40 bg-slate-950/60 p-3 animate-in fade-in duration-150">
              <div>
                <p className="mb-1 font-semibold text-rose-200">Rival foil</p>
                <p className="text-slate-300">
                  {activeNode.rivalName}: <span className="italic text-slate-400">{activeNode.rivalDialogue}</span>
                </p>
              </div>
              <div>
                <p className="mb-1 font-semibold text-amber-200">Branch decisions</p>
                {story.branchHistory.length === 0 ? (
                  <p className="text-slate-400">No branches chosen yet — finish Act 1 to open the first fork.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {story.branchHistory.map((entry) => (
                      <li key={`${entry.nodeId}-${entry.chosenOptionId}-${entry.resolvedDay}`}>
                        Day {entry.resolvedDay}: {entry.chosenOptionId.replace(/_/g, ' ')} → flag{' '}
                        <span className="text-amber-200">{entry.storyFlagGranted}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-sky-200">
                  <Flag size={12} aria-hidden="true" />
                  Story flags
                </p>
                {storyFlags.length === 0 ? (
                  <p className="text-slate-400">No story flags yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {storyFlags.map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                      >
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

      <div className="mt-2 overflow-hidden rounded-lg border-2 border-slate-700/80 bg-slate-900/80 text-xs shadow-inner transition-all">
        <button
          type="button"
          onClick={() => {
            void gameAudio.playClick().catch(() => {});
            setExpanded((prev) => !prev);
          }}
          className="flex w-full min-h-9 cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          aria-expanded={expanded}
        >
          <Target size={14} className={claimed ? 'text-emerald-300' : 'text-amber-300'} aria-hidden="true" />
          <span className="font-semibold text-slate-100">Daily goal · {challenge.def.description}</span>

          <div
            className="mx-2 hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-800 sm:block"
            role="progressbar"
            aria-valuenow={challenge.progress}
            aria-valuemax={challenge.def.target}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${claimed ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (challenge.progress / Math.max(1, challenge.def.target)) * 100)}%` }}
            />
          </div>

          <span className={`ml-auto tabular-nums font-medium ${claimed ? 'text-emerald-300' : 'text-amber-200'}`}>
            {claimed
              ? 'Reward earned ✓'
              : `${challenge.progress}/${challenge.def.target} · +$${challenge.def.reward.money}`}
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180 text-amber-300' : ''}`}
            aria-hidden="true"
          />
        </button>

        {expanded && (
          <div className="grid gap-3 border-t-2 border-slate-800/80 bg-slate-950/50 p-3 sm:grid-cols-2 animate-in fade-in duration-150">
            <div>
              <p className="font-semibold text-amber-200">{challenge.def.title}</p>
              <p className="mt-1 text-slate-300">
                ${challenge.def.reward.money} · +{challenge.def.reward.reputation} reputation · +
                {challenge.def.reward.xp} XP
              </p>
              <p className="mt-1 text-slate-400">
                Rewards arrive automatically as you play. A new goal arrives each day.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sky-200">{next ? 'Next studio expansion' : 'Studio fully expanded'}</p>
              {next && (
                <p className="mt-1 text-slate-300">
                  Level {next.currentLevel}/{next.levelNeeded} · Crew {next.currentStaff}/{next.staffNeeded} ·
                  Releases {next.currentProjects}/{next.projectsNeeded}
                </p>
              )}
              {next && (
                <button
                  onClick={onStaff}
                  className="mt-1 min-h-9 font-semibold text-sky-200 underline underline-offset-4 hover:text-sky-100"
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
