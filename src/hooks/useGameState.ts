import { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerData, FocusAllocation, StudioSkill, Project, LevelUpDetails } from '@/types/game'; // Added LevelUpDetails
import { saveGame, loadGame, startAutoSave, stopAutoSave } from '@/utils/saveLoadUtils';
import { generateNewProjects } from '@/utils/projectUtils';

// Declare window interface
declare global {
  interface Window {
    gameState: GameState;
  }
}

const INITIAL_PLAYER_ATTRIBUTES: PlayerData['attributes'] = {
  focusMastery: 1, 
  creativeIntuition: 1,
  technicalAptitude: 1,
  businessAcumen: 1,
  creativity: 5, // Initialize new attributes
  technical: 5,
  business: 5,
  charisma: 5,
  luck: 1,
};

const INITIAL_PLAYER_DATA: PlayerData = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  perkPoints: 0,
  attributes: INITIAL_PLAYER_ATTRIBUTES,
  dailyWorkCapacity: 100,
  reputation: 0, 
  // lastMinigameType is optional
};

const INITIAL_STUDIO_SKILLS: Record<string, StudioSkill> = {
  recording: { name: 'Recording', level: 1, xp: 0, xpToNext: 100, bonuses: {} },
  mixing: { name: 'Mixing', level: 1, xp: 0, xpToNext: 100, bonuses: {} },
  mastering: { name: 'Mastering', level: 1, xp: 0, xpToNext: 100, bonuses: {} },
};

const INITIAL_FOCUS_ALLOCATION: FocusAllocation = {
  performance: 33,
  soundCapture: 34,
  layering: 33,
  reasoning: "Initial default distribution."
};

const INITIAL_GAME_STATE: GameState = {
  money: 10000,
  reputation: 0, // Overall game reputation, distinct from player's personal reputation in PlayerData
  playerData: INITIAL_PLAYER_DATA,
  currentDay: 1,
  studioSkills: INITIAL_STUDIO_SKILLS,
  ownedEquipment: [],
  ownedUpgrades: [],
  availableProjects: [],
  activeProject: null,
  hiredStaff: [],
  availableCandidates: [],
  lastSalaryDay: 0,
  currentEra: 'modern', 
  currentYear: 2024, 
  selectedEra: 'modern', 
  eraStartYear: 2024, 
  equipmentMultiplier: 1.0, 
  notifications: [],
  bands: [],
  playerBands: [],
  availableSessionMusicians: [],
  activeOriginalTrack: null,
  chartsData: {
    charts: [],
    contactedArtists: [],
    marketTrends: [],
    discoveredArtists: [],
    lastChartUpdate: 0,
  },
  focusAllocation: INITIAL_FOCUS_ALLOCATION,
  levelUpDetails: null, // Added for the modal
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedGame = loadGame();
    if (savedGame) {
        if (!savedGame.focusAllocation) {
            savedGame.focusAllocation = INITIAL_FOCUS_ALLOCATION;
        }
        // Ensure all parts of PlayerData are present, especially attributes
        if (!savedGame.playerData || !savedGame.playerData.attributes) {
            savedGame.playerData = {
                ...INITIAL_PLAYER_DATA, // Start with defaults
                ...(savedGame.playerData || {}), // Overlay saved player data
                attributes: savedGame.playerData?.attributes || INITIAL_PLAYER_ATTRIBUTES, // Ensure attributes
            };
        }
        return savedGame;
    }
    return INITIAL_GAME_STATE;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.gameState = gameState;
    }
  }, [gameState]);

  useEffect(() => {
    startAutoSave(); 
    return () => {
      stopAutoSave();
    };
  }, []);

  const updateGameState = useCallback((updater: (prevState: GameState) => GameState) => {
    setGameState(prevState => {
      const newState = updater(prevState);
      saveGame(newState);
      return newState;
    });
  }, []);

  const setFocusAllocation = useCallback((newFocus: FocusAllocation) => {
    updateGameState(prevState => ({
      ...prevState,
      focusAllocation: newFocus,
    }));
  }, [updateGameState]);

  const startNewGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    saveGame(INITIAL_GAME_STATE);
  }, []);

  const advanceDay = useCallback(() => {
    updateGameState(prevState => {
      let newState = { ...prevState, currentDay: prevState.currentDay + 1 };
      
      if (newState.availableProjects.length < 5) { // Check availableProjects
        // Correctly call generateNewProjects with count, playerLevel, and currentEra
        const projectsToGenerate = 5 - newState.availableProjects.length;
        const newProjects = generateNewProjects(projectsToGenerate, newState.playerData.level, newState.currentEra);
        newState.availableProjects = [...newState.availableProjects, ...newProjects];
      }

      if (newState.activeProject) {
        const activeProjectCopy = { ...newState.activeProject };
        const currentStageData = activeProjectCopy.stages[activeProjectCopy.currentStageIndex];

        if (currentStageData.workUnitsCompleted >= currentStageData.workUnitsBase) {
          if (activeProjectCopy.currentStageIndex < activeProjectCopy.stages.length - 1) {
            newState.activeProject = { 
              ...activeProjectCopy, 
              currentStageIndex: activeProjectCopy.currentStageIndex + 1 
            };
          } else {
            const completedProjectUpdate: Partial<Project> = { 
              // Mark stages as completed
              stages: activeProjectCopy.stages.map(s => ({...s, completed: true}))
            };
            const completedProject = { ...activeProjectCopy, ...completedProjectUpdate };
            
            const newPlayerData = { ...newState.playerData };
            newState.money += completedProject.payoutBase; // GameState money
            newPlayerData.reputation += completedProject.repGainBase; // PlayerData reputation
            
            newState = {
              ...newState,
              playerData: newPlayerData,
              // Consider adding to a completedProjects array if it existed on GameState
              // availableProjects: [...newState.availableProjects, completedProject], // Or move to a different list
              activeProject: null,
            };
          }
        }
      }
      return newState;
    });
  }, [updateGameState]);

  const startProject = useCallback((projectId: string) => {
    updateGameState(prevState => {
      const projectToStart = prevState.availableProjects.find(p => p.id === projectId);
      if (!projectToStart) return prevState;

      return {
        ...prevState,
        activeProject: projectToStart,
        availableProjects: prevState.availableProjects.filter(p => p.id !== projectId)
      };
    });
  }, [updateGameState]);

  const addWorkToProject = useCallback((value: number) => {
    updateGameState(prevState => {
      if (!prevState.activeProject) {
        return prevState;
      }
      const activeProjectCopy = { ...prevState.activeProject };
      const currentStageIndex = activeProjectCopy.currentStageIndex;
      
      const updatedStages = activeProjectCopy.stages.map((stage, index) => {
        if (index === currentStageIndex) {
          return {
            ...stage,
            workUnitsCompleted: stage.workUnitsCompleted + value,
          };
        }
        return stage;
      });

      return {
        ...prevState,
        activeProject: {
          ...activeProjectCopy,
          stages: updatedStages,
        },
      };
    });
  }, [updateGameState]);

  const [levelUpModalData, setLevelUpModalData] = useState<LevelUpDetails | null>(null);

  const triggerLevelUpModal = useCallback((details: LevelUpDetails) => {
    setLevelUpModalData(details);
    // Potentially play a sound effect here too
    // gameAudio.playUISound('level-up'); 
  }, []);

  const clearLevelUpModal = useCallback(() => {
    setLevelUpModalData(null);
  }, []);

  return {
    gameState,
    focusAllocation: gameState.focusAllocation, // Expose focusAllocation directly
    setFocusAllocation, // Expose specific setter
    updateGameState, // Generic updater, can be used by useGameActions
    // Keep specific actions here for now, or confirm they are in useGameActions
    startNewGame,
    advanceDay, 
    startProject,
    addWorkToProject,
    levelUpModalData, // Expose modal data
    triggerLevelUpModal, // Expose trigger function
    clearLevelUpModal // Expose clear function
  };
}
