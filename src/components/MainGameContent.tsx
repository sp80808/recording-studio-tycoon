
import React, { useState } from 'react';
import { GameState, Project, FocusAllocation } from '@/types/game';
import { ProjectList } from './ProjectList';
import { EnhancedActiveProject } from './EnhancedActiveProject';
import { StudioManagement } from './StudioManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Music, Building2, Headphones } from 'lucide-react';

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

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number, type: string) => {
    if (gameState.activeProject) {
      setGameState(prev => ({
        ...prev,
        activeProject: prev.activeProject ? {
          ...prev.activeProject,
          accumulatedCPoints: prev.activeProject.accumulatedCPoints + creativityBonus,
          accumulatedTPoints: prev.activeProject.accumulatedTPoints + technicalBonus
        } : null,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + xpBonus
        }
      }));
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-900/50 via-gray-800/50 to-gray-900/50 backdrop-blur-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50">
          <TabsTrigger 
            value="projects" 
            className="text-white data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 transition-all duration-200"
          >
            <Music className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="recording" 
            className="text-white data-[state=active]:bg-green-600/20 data-[state=active]:text-green-300 transition-all duration-200"
          >
            <Headphones className="w-4 h-4 mr-2" />
            Recording
          </TabsTrigger>
          <TabsTrigger 
            value="studio" 
            className="text-white data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300 transition-all duration-200"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="p-6 h-full">
          <div className="h-full">
            <ProjectList
              gameState={gameState}
              setGameState={setGameState}
              startProject={startProject}
            />
          </div>
        </TabsContent>

        <TabsContent value="recording" className="p-6 h-full">
          <div className="h-full">
            <EnhancedActiveProject
              gameState={gameState}
              focusAllocation={focusAllocation}
              setFocusAllocation={setFocusAllocation}
              performDailyWork={() => workOnProject(10, 10)}
              onMinigameReward={handleMinigameReward}
            />
          </div>
        </TabsContent>

        <TabsContent value="studio" className="p-6 h-full">
          <StudioManagement
            gameState={gameState}
            setGameState={setGameState}
            buyEquipment={buyEquipment}
            upgradeStudio={upgradeStudio}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
