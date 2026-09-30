import React, { FC } from 'react';
import { Project, StaffMember } from '../types/game'; // Assuming types are in game.ts or similar
// Define ProjectAnimationState if it's not already globally available
// For example:
// interface ProjectAnimationState { /* ... properties ... */ }

interface ProjectAnimationState {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  // Add other animation-related properties as needed
}

interface AnimatedProjectCardProps {
  project: Project;
  assignedStaff: StaffMember[];
  animationState: ProjectAnimationState; // Replaced 'any' with ProjectAnimationState
  priority: number;
  progress: number;
  onSelect: (projectId: string) => void;
  onRemove?: (projectId: string) => void; // Optional remove functionality
  className?: string;
}

const AnimatedProjectCard: FC<AnimatedProjectCardProps> = ({
  project,
  assignedStaff,
  animationState,
  priority,
  progress,
  onSelect,
  onRemove,
  className,
}) => {
  // Basic card structure - to be fleshed out later
  // This structure is based on the MULTI_PROJECT_AUTOMATION_PLAN.md
  // ┌─────────────────┐
  // │   Project A     │
  // │   [🎤 Recording]│
  // │   ██████░░░ 70% │
  // │   👤👤 2 Staff  │
  // │   Auto: ON      │
  // └─────────────────┘

  const currentStageName = project.stages[project.currentStageIndex]?.stageName || 'N/A';
  const staffCount = assignedStaff.length;
  // Placeholder for automation status - this will need to come from project or global state
  const isAutomated = true; 

  return (
    <div
      className={`p-4 border rounded-lg shadow-md bg-stone-800 text-white ${className}`}
      onClick={() => onSelect(project.id)}
    >
      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
      <p className="text-sm text-stone-400 mb-1">Stage: {currentStageName}</p>
      <div className="w-full bg-stone-700 rounded-full h-2.5 mb-2">
        <div
          className="bg-amber-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-stone-300 mb-1">{progress}% Complete</p>
      <p className="text-sm text-stone-400 mb-1">Staff: {staffCount}</p>
      <p className="text-sm text-stone-400">Priority: {priority}</p>
      <p className="text-sm text-green-400">Auto: {isAutomated ? 'ON' : 'OFF'}</p>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card selection when removing
            onRemove(project.id);
          }}
          className="mt-2 text-xs bg-red-400/[0.14] ring-1 ring-inset ring-red-400/45 hover:bg-red-400/[0.24] text-red-100 py-1 px-2 rounded"
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default AnimatedProjectCard;
