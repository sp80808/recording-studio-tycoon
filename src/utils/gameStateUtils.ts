import { GameState, Project, FocusAllocation } from '@/types/game';

const DEFAULT_FOCUS_ALLOCATION: FocusAllocation = {
  performance: 33,
  soundCapture: 33,
  layering: 34,
};

/**
 * Migrates and initializes a loaded game state.
 * Ensures all projects have a focusAllocation.
 * Can be expanded for other migration tasks in the future.
 * @param loadedGameState The raw game state loaded from a save.
 * @returns The processed game state.
 */
export const migrateAndInitializeGameState = (loadedGameState: GameState): GameState => {
  const processedState = { ...loadedGameState };

  // Ensure activeProjects have focusAllocation
  if (processedState.activeProjects) {
    processedState.activeProjects = processedState.activeProjects.map((project: Project) => {
      if (!project.focusAllocation) {
        return {
          ...project,
          focusAllocation: { ...DEFAULT_FOCUS_ALLOCATION },
        };
      }
      return project;
    });
  } else {
    processedState.activeProjects = [];
  }

  // Ensure availableProjects have focusAllocation
  if (processedState.availableProjects) {
    processedState.availableProjects = processedState.availableProjects.map((project: Project) => {
      if (!project.focusAllocation) {
        return {
          ...project,
          focusAllocation: { ...DEFAULT_FOCUS_ALLOCATION },
        };
      }
      return project;
    });
  } else {
    processedState.availableProjects = [];
  }
  
  // Ensure the single activeProject (if used) also has focusAllocation
  // This is for backward compatibility during transition or if it's still used directly
  if (processedState.activeProject && !processedState.activeProject.focusAllocation) {
    processedState.activeProject = {
      ...processedState.activeProject,
      focusAllocation: { ...DEFAULT_FOCUS_ALLOCATION },
    };
  }

  // Add other migration logic here as needed in the future

  return processedState;
};
