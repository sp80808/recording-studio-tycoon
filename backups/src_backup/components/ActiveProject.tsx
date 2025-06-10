import React from 'react';
import { Project, StaffMember, StudioSkill } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ActiveProjectProps {
  project: Project;
  staff: StaffMember[];
  onCompleteProject: (projectId: string) => void;
  onAdvanceProjectStage: (projectId: string) => void;
  onAssignStaffToStage: (projectId: string, staffId: string, stageIndex: number) => void;
  onUnassignStaffFromStage: (projectId: string, staffId: string, stageIndex: number) => void;
  playerSkills: Record<string, StudioSkill>;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  project,
  staff,
  onCompleteProject,
  onAdvanceProjectStage,
  onAssignStaffToStage,
  onUnassignStaffFromStage,
  playerSkills,
}) => {
  const currentStage = project.stages[project.currentStageIndex];
  const progressPercentage = (currentStage.workUnitsCompleted / currentStage.workUnitsRequired) * 100;

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-2">{project.name}</h3>
      <p className="text-gray-300 mb-4">{project.description}</p>

      <div className="mb-4">
        <p className="text-sm text-gray-400">Current Stage: {currentStage.name}</p>
        <Progress value={progressPercentage} className="w-full" />
        <p className="text-xs text-gray-400 mt-1">
          {currentStage.workUnitsCompleted} / {currentStage.workUnitsRequired} Work Units
        </p>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-2">Assigned Staff:</h4>
        {project.assignedStaff.length === 0 ? (
          <p className="text-gray-400">No staff assigned to this project.</p>
        ) : (
          <ul>
            {project.assignedStaff.map(staffId => {
              const assignedMember = staff.find(s => s.id === staffId);
              return (
                <li key={staffId} className="text-gray-300">
                  {assignedMember ? assignedMember.name : 'Unknown Staff'}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {currentStage.workUnitsCompleted >= currentStage.workUnitsRequired && (
          <Button onClick={() => onAdvanceProjectStage(project.id)}>
            Advance Stage
          </Button>
        )}
        {project.status === 'active' && (
          <Button onClick={() => onCompleteProject(project.id)}>
            Complete Project
          </Button>
        )}
      </div>
    </div>
  );
};
