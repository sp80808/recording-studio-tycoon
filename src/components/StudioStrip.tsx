import React from 'react';
import { IDLE_CHATTER, pickFlavour } from '@/data/flavour';
import { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic2, SlidersHorizontal, Users, ChevronUp, Inbox } from 'lucide-react';
import { getBookedStudioRoom } from '@/utils/studioRoomUtils';
import { VUMeter } from '@/components/ui/VUMeter';

interface StudioStripProps {
  gameState: GameState;
  onExpand: () => void;
  onBookNextEnquiry: () => void;
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

export const StudioStrip: React.FC<StudioStripProps> = ({
  gameState,
  onExpand,
  onBookNextEnquiry
}) => {
  const activeProject = gameState.activeProject;
  const progress = getProjectProgress(gameState);
  const assignedStaff = gameState.hiredStaff.filter(
    staff => staff.assignedProjectId === activeProject?.id
  );
  const nextEnquiry = gameState.availableProjects[0];
  const activeRoom = getBookedStudioRoom(gameState, activeProject);

  return (
    <div className="w-full h-[164px] bg-stone-950 border-t border-stone-700 flex items-stretch overflow-hidden">
      <div className="w-[34%] min-w-[280px] border-r border-stone-800 p-3 flex gap-3">
        <div className="flex-1 rounded-lg border border-stone-700 bg-stone-900/80 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-stone-900/70" />
          <div className="relative h-full p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <SlidersHorizontal size={14} />
              CONTROL ROOM
            </div>
            <div className="flex items-center justify-between">
              <VUMeter size="sm" level={activeProject ? 0.75 : 0.15} isActive={!!activeProject} label="OUTPUT" />
              <div className="ml-2 flex-1 text-xs text-stone-300">
                {assignedStaff.length > 0
                  ? assignedStaff.map(staff => staff.name).join(', ')
                  : activeProject
                    ? 'You are engineering'
                    : pickFlavour(IDLE_CHATTER, gameState.currentDay ?? 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="w-[38%] rounded-lg border border-stone-700 bg-stone-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/[0.03]" />
          <div className="relative h-full p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Mic2 size={14} />
              BOOTH
            </div>
            <div className="text-xs text-stone-300">
              {activeProject ? activeProject.genre : 'Ready for next artist'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-stone-500">
              {activeProject ? 'Session in progress' : 'Studio available'}
            </div>
            <div className="text-white font-semibold truncate">
              {activeProject?.title || 'Waiting for the next booking'}
            </div>
            {activeProject && (
              <div className="text-xs text-stone-400 mt-1">
                {activeProject.clientType} · {activeProject.genre}
                {activeRoom ? ` · ${activeRoom.name}` : ''}
              </div>
            )}
          </div>

          <div className="flex gap-4 text-right shrink-0">
            <div>
              <div className="text-[10px] uppercase text-stone-500">Cash</div>
              <div className="text-green-400 font-semibold">${gameState.money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-stone-500">Rep</div>
              <div className="text-amber-300 font-semibold">{gameState.reputation}</div>
            </div>
          </div>
        </div>

        <div>
          {activeProject ? (
            <>
              <div className="flex justify-between text-xs text-stone-400 mb-1">
                <span>Session progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-stone-800" />
            </>
          ) : (
            <div className="text-xs text-stone-500">
              Book a session from the enquiry inbox to get the room earning.
            </div>
          )}
        </div>
      </div>

      <div className="w-[30%] min-w-[250px] border-l border-stone-800 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-stone-500">
              <Inbox size={13} />
              Next enquiry
            </div>
            <span className="text-xs text-stone-500">{gameState.availableProjects.length} waiting</span>
          </div>

          {nextEnquiry ? (
            <>
              <div className="text-sm text-white font-medium truncate">
                {nextEnquiry.clientName || nextEnquiry.title}
              </div>
              <div className="text-xs text-stone-400 mt-0.5 truncate">
                {nextEnquiry.title} · ${nextEnquiry.payoutBase} · {nextEnquiry.matchRating} fit
              </div>
              {nextEnquiry.clientId && gameState.clientRelationships?.[nextEnquiry.clientId] && (
                <div className="text-[11px] text-purple-300 mt-1">
                  {gameState.clientRelationships[nextEnquiry.clientId].tier} repeat client
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-stone-500">Inbox clear</div>
          )}

          {assignedStaff.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-2">
              <Users size={13} />
              {assignedStaff.length} staff on current session
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!activeProject && nextEnquiry && (
            <Button
              onClick={onBookNextEnquiry}
              size="sm"
              className="flex-1 bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24] text-emerald-100"
            >
              Book ${nextEnquiry.payoutBase}
            </Button>
          )}
          <Button
            onClick={onExpand}
            size="sm"
            variant="outline"
            className="flex-1 border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200"
          >
            <ChevronUp size={14} className="mr-1" />
            Open Studio
          </Button>
        </div>
      </div>
    </div>
  );
};
