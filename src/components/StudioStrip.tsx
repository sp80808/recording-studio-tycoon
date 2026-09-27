import React from 'react';
import { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic2, SlidersHorizontal, Users, ChevronUp, Inbox } from 'lucide-react';

interface StudioStripProps {
  gameState: GameState;
  onExpand: () => void;
}

const getProjectProgress = (gameState: GameState) => {
  const project = gameState.activeProject;
  if (!project) return 0;

  const total = project.stages.reduce((sum, stage) => sum + stage.workUnitsBase, 0);
  const completed = project.stages.reduce(
    (sum, stage) => sum + Math.min(stage.workUnitsCompleted, stage.workUnitsBase),
    0
  );

  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

export const StudioStrip: React.FC<StudioStripProps> = ({ gameState, onExpand }) => {
  const activeProject = gameState.activeProject;
  const progress = getProjectProgress(gameState);
  const assignedStaff = gameState.hiredStaff.filter(
    staff => staff.assignedProjectId === activeProject?.id
  );
  const nextEnquiry = gameState.availableProjects[0];

  return (
    <div className="w-full h-[164px] bg-gray-950 border-t border-gray-700 flex items-stretch overflow-hidden">
      <div className="w-[34%] min-w-[280px] border-r border-gray-800 p-3 flex gap-3">
        <div className="flex-1 rounded-lg border border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gray-900/70" />
          <div className="relative h-full p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <SlidersHorizontal size={14} />
              CONTROL ROOM
            </div>
            <div>
              <div className="h-5 rounded bg-gray-800 border border-gray-700 flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              </div>
              <div className="mt-2 text-xs text-gray-300">
                {assignedStaff.length > 0
                  ? assignedStaff.map(staff => staff.name).join(', ')
                  : activeProject
                    ? 'You are engineering'
                    : 'Room idle'}
              </div>
            </div>
          </div>
        </div>

        <div className="w-[38%] rounded-lg border border-gray-700 bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />
          <div className="relative h-full p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Mic2 size={14} />
              BOOTH
            </div>
            <div className="text-xs text-gray-300">
              {activeProject ? activeProject.genre : 'Ready for next artist'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-gray-500">
              {activeProject ? 'Session in progress' : 'Studio available'}
            </div>
            <div className="text-white font-semibold truncate">
              {activeProject?.title || 'Waiting for the next booking'}
            </div>
            {activeProject && (
              <div className="text-xs text-gray-400 mt-1">
                {activeProject.clientType} · {activeProject.genre}
              </div>
            )}
          </div>

          <div className="flex gap-4 text-right shrink-0">
            <div>
              <div className="text-[10px] uppercase text-gray-500">Cash</div>
              <div className="text-green-400 font-semibold">${gameState.money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-500">Rep</div>
              <div className="text-blue-400 font-semibold">{gameState.reputation}</div>
            </div>
          </div>
        </div>

        <div>
          {activeProject ? (
            <>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Session progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-800" />
            </>
          ) : (
            <div className="text-xs text-gray-500">
              Book a session from the enquiry inbox to get the room earning.
            </div>
          )}
        </div>
      </div>

      <div className="w-[30%] min-w-[250px] border-l border-gray-800 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500">
              <Inbox size={13} />
              Next enquiry
            </div>
            <span className="text-xs text-gray-500">{gameState.availableProjects.length} waiting</span>
          </div>

          {nextEnquiry ? (
            <>
              <div className="text-sm text-white font-medium truncate">{nextEnquiry.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {nextEnquiry.genre} · ${nextEnquiry.payoutBase} · {nextEnquiry.matchRating} fit
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Inbox clear</div>
          )}

          {assignedStaff.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
              <Users size={13} />
              {assignedStaff.length} staff on current session
            </div>
          )}
        </div>

        <Button
          onClick={onExpand}
          size="sm"
          variant="outline"
          className="w-full border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-200"
        >
          <ChevronUp size={14} className="mr-1" />
          Open Studio
        </Button>
      </div>
    </div>
  );
};
