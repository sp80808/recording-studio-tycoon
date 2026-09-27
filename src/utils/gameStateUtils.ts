import { GameState, Project, FocusAllocation } from '@/types/game';
import { createDefaultStudioRooms } from '@/utils/studioRoomUtils';

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

  // Physical-room capacity was introduced after the original multi-project model.
  // Legacy saves receive the starter room and the future purchasable room catalog.
  if (!processedState.studioRooms || processedState.studioRooms.length === 0) {
    processedState.studioRooms = createDefaultStudioRooms();
  } else {
    const defaults = createDefaultStudioRooms();
    const existingById = new Map(processedState.studioRooms.map(room => [room.id, room]));
    processedState.studioRooms = defaults.map(defaultRoom => ({
      ...defaultRoom,
      ...(existingById.get(defaultRoom.id) || {})
    }));
  }

  // Assign physical rooms to legacy in-flight work. Preserve an existing
  // assignment when present; otherwise place the primary active project into
  // the first unlocked room and reuse that assignment if it is also mirrored
  // in activeProjects.
  const unlockedRoomIds = processedState.studioRooms
    .filter(room => room.unlocked)
    .map(room => room.id);
  const usedRoomIds = new Set<string>();

  if (processedState.activeProject) {
    const existingRoomId = processedState.activeProject.bookingRoomId;
    const primaryRoomId =
      existingRoomId && unlockedRoomIds.includes(existingRoomId)
        ? existingRoomId
        : unlockedRoomIds[0];

    if (primaryRoomId) {
      processedState.activeProject = {
        ...processedState.activeProject,
        bookingRoomId: primaryRoomId
      };
      usedRoomIds.add(primaryRoomId);
    }
  }

  processedState.activeProjects = (processedState.activeProjects || []).map(project => {
    if (
      processedState.activeProject &&
      project.id === processedState.activeProject.id &&
      processedState.activeProject.bookingRoomId
    ) {
      return {
        ...project,
        bookingRoomId: processedState.activeProject.bookingRoomId
      };
    }

    if (project.bookingRoomId && unlockedRoomIds.includes(project.bookingRoomId)) {
      usedRoomIds.add(project.bookingRoomId);
      return project;
    }

    const freeRoomId = unlockedRoomIds.find(roomId => !usedRoomIds.has(roomId));
    if (!freeRoomId) return project;

    usedRoomIds.add(freeRoomId);
    return {
      ...project,
      bookingRoomId: freeRoomId
    };
  });

  // Add other migration logic here as needed in the future

  // Ensure productionQueues exists for new production queue feature
  if ((processedState as any).productionQueues == null) {
    ;(processedState as any).productionQueues = {}
  }

  // Ensure quickAssignPresets exists for new quick-assign feature
  if ((processedState as any).quickAssignPresets == null) {
    ;(processedState as any).quickAssignPresets = []
  }

  return processedState;
};
