import React, { useState } from 'react';
import { GamePanel } from '@/components/ui/GamePanel';
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
import { gameAudio } from '@/utils/audioSystem';
import { getOriginEffects, gigRefreshCostFor } from '@/narrative/originPerks';
import { Check, XCircle, PhoneCall, PhoneOff } from 'lucide-react';

interface ProjectListProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  startProject: (project: Project) => void;
  /** Cooldown + cost gated gig refresh (bead goj.3). Falls back to inline roll. */
  onRefreshProjects?: () => boolean;
}

const getFitClasses = (matchRating: Project['matchRating']) => {
  switch (matchRating) {
    case 'Excellent':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Good':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    default:
      return 'bg-red-500/15 text-red-300 border-red-500/30';
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

export const ProjectList: React.FC<ProjectListProps> = ({
  gameState,
  setGameState,
  startProject,
  onRefreshProjects,
}) => {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const cooldownLeft = gigRefreshCooldownRemaining(gameState);
  const refreshReady = cooldownLeft === 0;
  const refreshCost = gigRefreshCostFor(GIG_REFRESH_COST, getOriginEffects(gameState));

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

    // Tactile action feedback communicated within short beat (~180ms)
    window.setTimeout(() => {
      startProject(project);
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

  return (
    <GamePanel className="p-4 flex-1 min-h-0 w-full flex flex-col backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Artist Enquiries</h2>
          <p className="text-xs text-stone-400 mt-1">
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
          <GamePanel variant="cyan" className="p-3 mb-4 shrink-0">
            <div className="text-xs text-teal-300 mb-1 font-bold uppercase tracking-wider">🎙 Session in progress</div>
            <div className="text-sm font-bold text-white mb-1">{gameState.activeProject.title}</div>
            <div className="text-xs text-teal-200/90 mb-2">
              Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}
            </div>
            <div className="text-xs text-stone-300 bg-stone-950/60 p-2 rounded border-l-2 border-teal-400">
              The session can keep progressing through the existing studio workflow. Optional interventions should add upside rather than block completion.
            </div>

            <div className="mt-2.5 pt-2 border-t border-teal-500/20">
              <div className="text-[11px] text-teal-300/80 mb-1 font-semibold">On the session:</div>
              {gameState.hiredStaff
                .filter(s => s.assignedProjectId === gameState.activeProject?.id)
                .map(staff => (
                  <div key={staff.id} className="text-xs text-stone-200">
                    👤 {staff.name} ({staff.role})
                  </div>
                ))}
              {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
                <div className="text-xs text-stone-400">You are handling this one yourself.</div>
              )}
            </div>
          </GamePanel>
        </MotionReveal>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 edge-fade-b">
        {gameState.availableProjects.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-sm text-stone-300 font-medium">No enquiries waiting</div>
            <div className="text-xs text-stone-500 mt-1">
              Finish work, build reputation, or check the inbox for another lead.
            </div>
          </div>
        )}

        {gameState.availableProjects.map((project, index) => {
          const isBookingThis = bookingId === project.id;
          const isDecliningThis = decliningId === project.id;

          return (
            <MotionReveal
              key={project.id}
              direction="up"
              distance={12}
              staggerIndex={index}
              staggerDelay={0.04}
            >
              <GamePanel
                variant="interactive"
                className={`p-3.5 game-interactive transition-opacity ${
                  isDecliningThis ? 'opacity-40 scale-95' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{project.title}</h3>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {project.clientName || project.clientType} · {project.genre}
                    </div>
                    {project.clientId && gameState.clientRelationships?.[project.clientId] && (
                      <div className="text-[11px] text-purple-300 mt-1">
                        ↻ {gameState.clientRelationships[project.clientId].tier} client · {gameState.clientRelationships[project.clientId].sessionsCompleted} previous session{gameState.clientRelationships[project.clientId].sessionsCompleted === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold border px-2 py-0.5 rounded-full whitespace-nowrap ${getFitClasses(project.matchRating)}`}
                  >
                    {project.matchRating} fit
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded border border-stone-700/60 bg-stone-950/70 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wide text-stone-400">Fee</div>
                    <div className="text-sm text-emerald-400 font-black">
                      <MotionNumber value={project.payoutBase} prefix="$" />
                    </div>
                  </div>
                  <div className="rounded border border-stone-700/60 bg-stone-950/70 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wide text-stone-400">Rep</div>
                    <div className="text-sm text-amber-300 font-black">
                      <MotionNumber value={project.repGainBase} prefix="+" />
                    </div>
                  </div>
                  <div className="rounded border border-stone-700/60 bg-stone-950/70 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wide text-stone-400">Time</div>
                    <div className="text-sm text-amber-300 font-black">
                      <MotionNumber value={project.durationDaysTotal} suffix="d" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-stone-400">Session difficulty</span>
                  <span className="text-amber-300 font-bold">{project.difficulty}/10</span>
                </div>

                <div className="text-xs text-stone-300 bg-stone-950/60 border border-stone-800 rounded p-2.5 leading-relaxed">
                  {getOpportunityNote(project)}
                </div>

                <div className="flex items-center gap-2 mt-3">
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

                  {!gameState.activeProject && (
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
              </GamePanel>
            </MotionReveal>
          );
        })}
      </div>
    </GamePanel>
  );
};

export default ProjectList;
