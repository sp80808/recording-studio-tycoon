import React, { useState } from 'react';
import { GameState, Project } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import {
  gigRefreshCooldownRemaining,
  GIG_REFRESH_COST,
  GIG_REFRESH_COOLDOWN_DAYS,
} from '@/hooks/useGameActions';
import {
  MotionReveal,
  MotionButton,
  MotionNumber,
} from '@/components/motion/primitives';
import ChainComposer from '@/components/ChainComposer';
import { saveTemplate, validateChain, type SignalChain } from '@/rpg/signalChain';
import BriefPanel from '@/components/BriefPanel';
import { getApproach, getProjectBrief, type ProductionApproach } from '@/rpg/projectBrief';
import { gameAudio } from '@/utils/audioSystem';
import { getOriginEffects, gigRefreshCostFor } from '@/narrative/originPerks';
import { getRivalAccent, getRivalLines, initialsOf } from '@/narrative/rivalCast';
import { RIVAL_STUDIOS } from '@/narrative/studioLore';
import {
  STAKE_MIN_LEVEL,
  STAKE_ORDER,
  STAKE_LABEL,
  describeStake,
  isStakeUnlocked,
  type ContractStake,
} from '@/rpg/contractStakes';
import { Check, Lock, Mic, Star, XCircle, PhoneCall, PhoneOff, Inbox, RefreshCw } from 'lucide-react';

interface ProjectListProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  startProject: (project: Project) => void;
  /** Cooldown + cost gated gig refresh (bead goj.3). Falls back to inline roll. */
  onRefreshProjects?: () => boolean;
}

const fitChip = (matchRating: Project['matchRating']) => {
  switch (matchRating) {
    case 'Excellent':
      return 'rst-chip-money';
    case 'Good':
      return 'rst-chip-brass';
    default:
      return 'rst-chip-danger';
  }
};

const getOpportunityNote = (project: Project) => {
  if (project.matchRating === 'Poor') {
    return 'Stretch booking — higher risk, useful skill growth if you can deliver.';
  }

  if (project.matchRating === 'Excellent' && project.difficulty >= 3) {
    return 'Strong studio fit — a good chance to turn this client into repeat work.';
  }

  if (project.durationDaysTotal <= 3) {
    return 'Quick turnaround — useful for keeping the room earning between larger sessions.';
  }

  if (project.repGainBase >= 5) {
    return 'Reputation opportunity — worth prioritising if you have capacity.';
  }

  return 'Balanced booking — reliable cash, experience and relationship potential.';
};

/** Safe / Ambitious / Moonshot picker. Locked tiers say which level opens them. */
const StakePicker: React.FC<{
  value: ContractStake;
  level: number;
  locked?: boolean;
  onChange: (stake: ContractStake) => void;
}> = ({ value, level, locked, onChange }) => (
  <div>
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <span className="rst-kicker">Contract stake</span>
      {locked && (
        <span className="rst-chip rst-chip-story !py-0.5 text-[10px]">
          <Lock size={10} aria-hidden="true" /> Fixed by the story
        </span>
      )}
    </div>
    <div className="mt-1.5 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Contract stake">
      {STAKE_ORDER.map((stake) => {
        const unlocked = isStakeUnlocked(stake, level);
        const selected = value === stake;
        return (
          <button
            key={stake}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked || !unlocked}
            onClick={() => onChange(stake)}
            className={`rst-btn !min-h-9 !px-2 !text-xs ${selected ? 'rst-btn-primary' : ''}`}
            title={unlocked ? describeStake(stake) : `Unlocks at producer level ${STAKE_MIN_LEVEL[stake]}`}
          >
            {!unlocked && <Lock size={11} aria-hidden="true" />}
            {STAKE_LABEL[stake]}
          </button>
        );
      })}
    </div>
    <p className="rst-muted mt-1.5 text-[11px] leading-relaxed">{describeStake(value)}</p>
  </div>
);

export const ProjectList: React.FC<ProjectListProps> = ({
  gameState,
  setGameState,
  startProject,
  onRefreshProjects,
}) => {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [approaches, setApproaches] = useState<Record<string, ProductionApproach['id'] | undefined>>({});
  const [chains, setChains] = useState<Record<string, SignalChain | undefined>>({});
  const [stakes, setStakes] = useState<Record<string, ContractStake>>({});
  const cooldownLeft = gigRefreshCooldownRemaining(gameState);
  const refreshReady = cooldownLeft === 0;
  const refreshCost = gigRefreshCostFor(GIG_REFRESH_COST, getOriginEffects(gameState));
  const level = gameState.playerData.level;

  const handleRefresh = () => {
    void gameAudio.playTactileClick();
    if (onRefreshProjects) {
      onRefreshProjects();
      return;
    }
    setGameState(prev => ({
      ...prev,
      availableProjects: [
        ...prev.availableProjects,
        ...generateNewProjects(
          1,
          prev.playerData.level,
          prev.currentEra,
          Object.values(prev.clientRelationships || {})
        )
      ]
    }));
  };

  const handleAcceptEnquiry = (project: Project) => {
    if (gameState.activeProject || bookingId) return;
    setBookingId(project.id);
    void gameAudio.playTactileClick();

    // The player's chosen gamble rides along (story contracts keep their fixed stake).
    const stake = project.stakeLocked ? project.stake ?? 'safe' : stakes[project.id] ?? project.stake ?? 'safe';

    // Tactile action feedback communicated within short beat (~180ms)
    window.setTimeout(() => {
      const approach = getApproach(approaches[project.id]);
      const chain = chains[project.id];
      const chainOk = chain && validateChain(chain, gameState, project.id).broken.length === 0;
      startProject({
        ...project,
        stake,
        ...(chainOk ? { signalChain: chain } : {}),
        brief: getProjectBrief(project),
        ...(approach ? { approachId: approach.id, focusAllocation: approach.focus } : {}),
      });
      setBookingId(null);
    }, 180);
  };

  const handleDeclineEnquiry = (projectId: string) => {
    if (decliningId) return;
    setDecliningId(projectId);
    void gameAudio.playUISound('buttonClick');

    // Tactile pass feedback communicated within short beat (~180ms)
    window.setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        availableProjects: prev.availableProjects.filter(p => p.id !== projectId),
      }));
      setDecliningId(null);
    }, 180);
  };

  // Story contracts are pinned to the top; everything else keeps its arrival order.
  const board = [...gameState.availableProjects].sort(
    (a, b) => Number(Boolean(b.isStoryContract)) - Number(Boolean(a.isStoryContract)),
  );

  return (
    <section className="rst-surface flex min-h-0 w-full flex-1 flex-col p-4" aria-label="Artist enquiries">
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="rst-title text-xl">Artist Enquiries</h2>
          <p className="rst-muted mt-1 text-xs">
            Choose the sessions that best fit your room, staff and current cashflow.
          </p>
        </div>
        <MotionButton
          onClick={handleRefresh}
          disabled={!refreshReady}
          className={`rst-btn !min-h-9 !px-3 !text-xs ${refreshReady ? 'rst-btn-primary' : ''}`}
        >
          {refreshReady ? (
            <>
              <PhoneCall size={14} aria-hidden="true" />
              <span>{refreshCost > 0 ? `Refresh $${refreshCost}` : 'Refresh · free'}</span>
            </>
          ) : (
            <>
              <PhoneOff size={14} aria-hidden="true" />
              <span>{cooldownLeft}/{GIG_REFRESH_COOLDOWN_DAYS}d</span>
            </>
          )}
        </MotionButton>
      </div>

      {gameState.activeProject && (
        <MotionReveal direction="down" distance={10}>
          <div className="mb-4 shrink-0 rounded-xl border border-[rgba(95,208,192,0.35)] bg-[rgba(95,208,192,0.06)] p-3">
            <p className="rst-kicker flex items-center gap-1.5 !text-[var(--rst-live)]">
              <Mic size={12} aria-hidden="true" /> Session in progress
            </p>
            <div className="mt-1 text-sm font-semibold text-[var(--rst-ivory)]">{gameState.activeProject.title}</div>
            <div className="rst-muted mt-0.5 text-xs">
              Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}
            </div>

            <div className="mt-2.5 border-t border-[var(--rst-line)] pt-2">
              <div className="rst-kicker mb-1">On the session</div>
              {gameState.hiredStaff
                .filter(s => s.assignedProjectId === gameState.activeProject?.id)
                .map(staff => (
                  <div key={staff.id} className="text-xs text-stone-200">
                    {staff.name} <span className="text-stone-500">· {staff.role}</span>
                  </div>
                ))}
              {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
                <div className="rst-muted text-xs">You are handling this one yourself.</div>
              )}
            </div>
          </div>
        </MotionReveal>
      )}

      <div className="edge-fade-b min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {board.length === 0 && (
          <div className="px-4 py-10 text-center">
            <Inbox size={34} strokeWidth={1.4} className="mx-auto mb-3 text-[var(--rst-brass-400)]" aria-hidden="true" />
            <div className="text-sm font-medium text-stone-200">No enquiries waiting</div>
            <div className="rst-muted mt-1 text-xs">
              Finish work, build reputation, or use the phone to chase another lead.
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!refreshReady}
              className="rst-btn mt-4 !min-h-9 !px-3 !text-xs"
            >
              <RefreshCw size={13} aria-hidden="true" />
              {refreshReady ? 'Chase a new lead' : `Phone is quiet · ${cooldownLeft}d`}
            </button>
          </div>
        )}

        {board.map((project, index) => {
          const isBookingThis = bookingId === project.id;
          const isDecliningThis = decliningId === project.id;
          const isStory = Boolean(project.isStoryContract);
          const rival = isStory ? RIVAL_STUDIOS.find((r) => r.id === project.rivalStudioId) : undefined;
          const accent = rival ? getRivalAccent(rival.id) : undefined;
          const chosenStake: ContractStake = project.stakeLocked ? project.stake ?? 'safe' : stakes[project.id] ?? project.stake ?? 'safe';

          return (
            <MotionReveal
              key={project.id}
              direction="up"
              distance={12}
              staggerIndex={index}
              staggerDelay={0.04}
            >
              <article
                className={`rst-surface p-3.5 transition-opacity ${isDecliningThis ? 'scale-95 opacity-40' : 'opacity-100'}`}
                style={isStory && accent ? { borderColor: `${accent}66` } : undefined}
                data-story-contract={isStory ? 'true' : undefined}
              >
                {isStory && rival && accent && (
                  <div className="mb-3 flex items-start gap-3 border-b border-[var(--rst-line)] pb-3">
                    <span
                      aria-hidden="true"
                      className="rst-serif grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-bold"
                      style={{ borderColor: `${accent}88`, color: accent, background: `${accent}14` }}
                    >
                      {initialsOf(rival.headProducer)}
                    </span>
                    <div className="min-w-0">
                      <p className="rst-kicker flex items-center gap-1.5" style={{ color: accent }}>
                        <Star size={11} aria-hidden="true" /> Story contract · {rival.headProducer}
                      </p>
                      <p className="mt-0.5 font-[var(--rst-serif)] text-xs italic leading-relaxed text-[var(--rst-ivory-soft)]">
                        {getRivalLines(rival.id).challenge}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--rst-ivory)]">{project.title}</h3>
                    <div className="rst-muted mt-0.5 text-xs">
                      {project.clientName || project.clientType} · {project.genre}
                    </div>
                    {project.clientId && gameState.clientRelationships?.[project.clientId] && (
                      <div className="mt-1 text-[11px] text-[var(--rst-story)]">
                        ↻ {gameState.clientRelationships[project.clientId].tier} client · {gameState.clientRelationships[project.clientId].sessionsCompleted} previous session{gameState.clientRelationships[project.clientId].sessionsCompleted === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                  <span className={`rst-chip ${fitChip(project.matchRating)} whitespace-nowrap`}>
                    {project.matchRating} fit
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--rst-line)] bg-black/25 p-2">
                    <div className="rst-kicker !text-[10px]">Fee</div>
                    <div className="text-sm font-bold text-[var(--rst-money)]">
                      <MotionNumber value={project.payoutBase} prefix="$" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--rst-line)] bg-black/25 p-2">
                    <div className="rst-kicker !text-[10px]">Rep</div>
                    <div className="text-sm font-bold text-[var(--rst-brass-300)]">
                      <MotionNumber value={project.repGainBase} prefix="+" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--rst-line)] bg-black/25 p-2">
                    <div className="rst-kicker !text-[10px]">Time</div>
                    <div className="text-sm font-bold text-[var(--rst-ivory)]">
                      <MotionNumber value={project.durationDaysTotal} suffix="d" />
                    </div>
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="rst-muted">Session difficulty</span>
                  <span className="font-semibold text-[var(--rst-brass-300)]">{project.difficulty}/10</span>
                </div>

                <div className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs leading-relaxed text-stone-300">
                  {isStory
                    ? 'The rival is watching this one. A strong result counts toward the campaign objective.'
                    : getOpportunityNote(project)}
                </div>

                <BriefPanel
                  project={project}
                  state={gameState}
                  approachId={approaches[project.id]}
                  onApproach={(id) => {
                    void gameAudio.playUISound('buttonClick');
                    setApproaches((prev) => ({ ...prev, [project.id]: prev[project.id] === id ? undefined : id }));
                  }}
                />

                {['vocal-production', 'tracking'].includes(getProjectBrief(project).serviceType) && (
                  <ChainComposer
                    project={project}
                    state={gameState}
                    chain={chains[project.id]}
                    onChange={(c) => setChains((prev) => ({ ...prev, [project.id]: c }))}
                    onSaveTemplate={(c, name) =>
                      setGameState((prev) => ({ ...prev, chainTemplates: saveTemplate(prev.chainTemplates, c, name) }))
                    }
                  />
                )}

                <StakePicker
                  value={chosenStake}
                  level={level}
                  locked={Boolean(project.stakeLocked)}
                  onChange={(stake) => {
                    void gameAudio.playUISound('buttonClick');
                    setStakes((prev) => ({ ...prev, [project.id]: stake }));
                  }}
                />

                <div className="mt-3 flex items-center gap-2">
                  <MotionButton
                    magnetic
                    onClick={() => handleAcceptEnquiry(project)}
                    disabled={!!gameState.activeProject || !!bookingId || !!decliningId}
                    className={`rst-btn flex-1 ${gameState.activeProject ? '' : 'rst-btn-primary'} ${isBookingThis ? 'rst-btn-success' : ''}`}
                  >
                    {isBookingThis ? (
                      <>
                        <Check size={14} className="animate-in zoom-in" />
                        <span>Booked! Starting…</span>
                      </>
                    ) : gameState.activeProject ? (
                      'Studio Occupied'
                    ) : (
                      'Book Session'
                    )}
                  </MotionButton>

                  {!gameState.activeProject && !isStory && (
                    <MotionButton
                      onClick={() => handleDeclineEnquiry(project.id)}
                      disabled={!!bookingId || !!decliningId}
                      className="rst-btn rst-btn-ghost !min-h-9 !px-2.5 text-stone-400 hover:!text-rose-300"
                      title="Decline enquiry"
                      aria-label={`Decline enquiry from ${project.title}`}
                    >
                      <XCircle size={16} />
                    </MotionButton>
                  )}
                </div>
              </article>
            </MotionReveal>
          );
        })}
      </div>
    </section>
  );
};

export default ProjectList;
