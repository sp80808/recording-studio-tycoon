import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, Project } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';

interface ProjectListProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  startProject: (project: Project) => void;
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
  startProject
}) => {
  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full flex flex-col backdrop-blur-sm animate-slide-in-left">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Artist Enquiries</h2>
          <p className="text-xs text-gray-400 mt-1">
            Choose the sessions that best fit your room, staff and current cashflow.
          </p>
        </div>
        <Button
          onClick={() => setGameState(prev => ({
            ...prev,
            availableProjects: [
              ...prev.availableProjects,
              ...generateNewProjects(1, prev.playerData.level, prev.currentEra)
            ]
          }))}
          size="sm"
          variant="outline"
          className="border-gray-600 text-gray-200 hover:bg-gray-800"
        >
          Check Inbox
        </Button>
      </div>

      {gameState.activeProject && (
        <Card className="p-4 bg-blue-900/80 border-blue-400 backdrop-blur-sm mb-4">
          <div className="text-sm text-blue-200 mb-2 font-semibold">🎙 Session in progress</div>
          <div className="text-sm text-white mb-1">{gameState.activeProject.title}</div>
          <div className="text-xs text-blue-300 mb-2">
            Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}
          </div>
          <div className="text-xs text-gray-300 bg-blue-900/40 p-2 rounded border-l-2 border-blue-400">
            The session can keep progressing through the existing studio workflow. Optional interventions should add upside rather than block completion.
          </div>

          <div className="mt-3 pt-2 border-t border-blue-400/30">
            <div className="text-xs text-blue-300 mb-1">On the session:</div>
            {gameState.hiredStaff
              .filter(s => s.assignedProjectId === gameState.activeProject?.id)
              .map(staff => (
                <div key={staff.id} className="text-xs text-gray-200">
                  👤 {staff.name} ({staff.role})
                </div>
              ))}
            {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
              <div className="text-xs text-gray-400">You are handling this one yourself.</div>
            )}
          </div>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
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
          <Card
            key={project.id}
            className="p-4 bg-gray-900/90 border-gray-600 hover:bg-gray-800/90 hover:border-gray-500 transition-colors backdrop-blur-sm"
          >
            <div className="flex justify-between items-start gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-white">{project.title}</h3>
                <div className="text-xs text-gray-400 mt-0.5">
                  {project.genre} · {project.clientType}
                </div>
              </div>
              <span
                className={`text-[11px] border px-2 py-1 rounded-full whitespace-nowrap ${getFitClasses(project.matchRating)}`}
              >
                {project.matchRating} fit
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded bg-gray-950/60 p-2">
                <div className="text-[10px] uppercase tracking-wide text-gray-500">Fee</div>
                <div className="text-sm text-green-400 font-semibold">${project.payoutBase}</div>
              </div>
              <div className="rounded bg-gray-950/60 p-2">
                <div className="text-[10px] uppercase tracking-wide text-gray-500">Rep</div>
                <div className="text-sm text-blue-400 font-semibold">+{project.repGainBase}</div>
              </div>
              <div className="rounded bg-gray-950/60 p-2">
                <div className="text-[10px] uppercase tracking-wide text-gray-500">Time</div>
                <div className="text-sm text-yellow-300 font-semibold">{project.durationDaysTotal}d</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-400">Session difficulty</span>
              <span className="text-orange-300 font-medium">{project.difficulty}/10</span>
            </div>

            <div className="text-xs text-gray-300 bg-gray-950/50 border border-gray-700/70 rounded p-2.5 leading-relaxed">
              {getOpportunityNote(project)}
            </div>

            <Button
              onClick={() => startProject(project)}
              disabled={!!gameState.activeProject}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400 text-white"
              size="sm"
            >
              {gameState.activeProject ? 'Studio Occupied' : 'Book Session'}
            </Button>
          </Card>
        ))}
      </div>
    </Card>
  );
};
