import React from 'react';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { GamePanel } from '@/components/ui/GamePanel';
import { GameState, Project } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import {
  gigRefreshCooldownRemaining,
  GIG_REFRESH_COST,
  GIG_REFRESH_COOLDOWN_DAYS,
} from '@/hooks/useGameActions';

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
  const cooldownLeft = gigRefreshCooldownRemaining(gameState);
  const refreshReady = cooldownLeft === 0;

  const handleRefresh = () => {
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

  return (
    <GamePanel className="p-4 h-full min-h-0 flex flex-col backdrop-blur-sm animate-slide-in-left">
      <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Artist Enquiries</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose the sessions that best fit your room, staff and current cashflow.
          </p>
        </div>
        <KenneyButton 
          onClick={handleRefresh}
          size="sm"
          variant={refreshReady ? 'blue' : 'grey'}
          disabled={!refreshReady}
        >
          {refreshReady
            ? `Refresh $${GIG_REFRESH_COST}`
            : `📵 ${cooldownLeft}/${GIG_REFRESH_COOLDOWN_DAYS}d`}
        </KenneyButton>
      </div>

      {gameState.activeProject && (
        <GamePanel variant="cyan" className="p-3 mb-4 shrink-0">
          <div className="text-xs text-cyan-300 mb-1 font-bold uppercase tracking-wider">🎙 Session in progress</div>
          <div className="text-sm font-bold text-white mb-1">{gameState.activeProject.title}</div>
          <div className="text-xs text-cyan-200/90 mb-2">
            Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}
          </div>
          <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded border-l-2 border-cyan-400">
            The session can keep progressing through the existing studio workflow. Optional interventions should add upside rather than block completion.
          </div>

          <div className="mt-2.5 pt-2 border-t border-cyan-500/20">
            <div className="text-[11px] text-cyan-300/80 mb-1 font-semibold">On the session:</div>
            {gameState.hiredStaff
              .filter(s => s.assignedProjectId === gameState.activeProject?.id)
              .map(staff => (
                <div key={staff.id} className="text-xs text-slate-200">
                  👤 {staff.name} ({staff.role})
                </div>
              ))}
            {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
              <div className="text-xs text-slate-400">You are handling this one yourself.</div>
            )}
          </div>
        </GamePanel>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 edge-fade-b">
        {gameState.availableProjects.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-sm text-gray-300 font-medium">No enquiries waiting</div>
            <div className="text-xs text-gray-500 mt-1">
              Finish work, build reputation, or check the inbox for another lead.
            </div>
          </div>
        )}

        {gameState.availableProjects.map(project => (
          <GamePanel
            key={project.id}
            variant="interactive"
            className="p-3.5 game-interactive"
          >
            <div className="flex justify-between items-start gap-3 mb-3">
              <div>
                <h3 className="font-bold text-white text-base">{project.title}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
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
              <div className="rounded border border-slate-700/60 bg-slate-950/70 p-2 shadow-inner">
                <div className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Fee</div>
                <div className="text-sm text-emerald-400 font-black">${project.payoutBase}</div>
              </div>
              <div className="rounded border border-slate-700/60 bg-slate-950/70 p-2 shadow-inner">
                <div className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Rep</div>
                <div className="text-sm text-sky-400 font-black">+{project.repGainBase}</div>
              </div>
              <div className="rounded border border-slate-700/60 bg-slate-950/70 p-2 shadow-inner">
                <div className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Time</div>
                <div className="text-sm text-amber-300 font-black">{project.durationDaysTotal}d</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Session difficulty</span>
              <span className="text-amber-300 font-bold">{project.difficulty}/10</span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded p-2.5 leading-relaxed">
              {getOpportunityNote(project)}
            </div>

            <KenneyButton
              onClick={() => startProject(project)}
              disabled={!!gameState.activeProject}
              variant={gameState.activeProject ? 'grey' : 'green'}
              size="md"
              className="w-full mt-3"
            >
              {gameState.activeProject ? 'Studio Occupied' : 'Book Session'}
            </KenneyButton>
          </GamePanel>
        ))}
      </div>
    </GamePanel>
  );
};
