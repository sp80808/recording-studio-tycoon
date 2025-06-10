
import React, { useState } from 'react';
import { GameState, Project, FocusAllocation } from '@/types/game';
import { ProjectList } from './ProjectList';
import { ActiveProject } from './ActiveProject';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface MainGameContentProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  focusAllocation: FocusAllocation;
  setFocusAllocation: (allocation: FocusAllocation) => void;
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  completeProject: () => void;
  startProject: (project: Project) => void;
  workOnProject: (creativityPoints: number, technicalPoints: number) => void;
  completeStage: () => void;
  generateProjects: () => void;
  triggerMinigame: (type: string, reason: string) => void;
  buyEquipment: (equipmentId: string) => void;
  hireStaff: (candidateIndex: number) => boolean;
  trainStaff: (staff: any, skill: string) => void;
  upgradeStudio: (studioId: string) => void;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: any) => boolean;
  spendPerkPoint: (attribute: string) => void;
  createBand: (bandName: string, memberIds: string[]) => void;
  createOriginalTrack: () => void;
}

export const MainGameContent: React.FC<MainGameContentProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
  activeProject,
  setActiveProject,
  completeProject,
  startProject,
  workOnProject,
  completeStage,
  generateProjects,
  triggerMinigame,
  buyEquipment,
  hireStaff,
  trainStaff,
  upgradeStudio,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  spendPerkPoint,
  createBand,
  createOriginalTrack
}) => {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="flex-1 bg-gray-800/50 backdrop-blur-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900/80">
          <TabsTrigger value="projects" className="text-white">Projects</TabsTrigger>
          <TabsTrigger value="studio" className="text-white">Studio</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="p-4 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <div>
              <ProjectList
                gameState={gameState}
                setGameState={setGameState}
                startProject={startProject}
              />
            </div>
            <div>
              <ActiveProject
                gameState={gameState}
                focusAllocation={focusAllocation}
                setFocusAllocation={setFocusAllocation}
                performDailyWork={() => workOnProject(10, 10)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="p-4">
          <div className="text-white">
            <h2 className="text-xl font-bold mb-4">Studio Management</h2>
            <p>Studio upgrade and management features coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
