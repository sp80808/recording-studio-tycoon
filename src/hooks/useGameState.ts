import { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerData, FocusAllocation, StudioSkill, Project, LevelUpDetails, StaffMember } from '@/types/game';
import { saveGame, loadGame, startAutoSave, stopAutoSave } from '@/utils/saveLoadUtils';
import { generateNewProjects } from '@/utils/projectUtils';
import { Band, OriginalTrackProject } from '@/types/bands';
import { useBandManagement, type BandManagement } from './useBandManagement';
import { useStudioExpansion } from './useStudioExpansion';
import { useStaffManagement } from './useStaffManagement';
import { useProjectManagement } from './useProjectManagement';

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
  name: "Player",
  level: 1,
  experience: 0,
  money: 0,
  reputation: 0,
  skills: {
    recording: 1,
    mixing: 1,
    mastering: 1,
    production: 1,
    marketing: 1
  },
  xp: 0,
  xpToNextLevel: 100,
  perkPoints: 0,
  attributes: INITIAL_PLAYER_ATTRIBUTES,
  dailyWorkCapacity: 100
};

const INITIAL_STUDIO_SKILLS: Record<string, StudioSkill> = {
  recording: {
    name: 'recording',
    level: 1,
    experience: 0,
    multiplier: 1.0
  },
  mixing: {
    name: 'mixing',
    level: 1,
    experience: 0,
    multiplier: 1.0
  },
  mastering: {
    name: 'mastering',
    level: 1,
    experience: 0,
    multiplier: 1.0
  }
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
  availableExpansions: [
    {
      id: 'control_room',
      name: 'Control Room',
      description: 'Add a professional control room for better mixing and mastering',
      cost: 50000,
      requirements: {
        level: 5,
        reputation: 50
      },
      benefits: {
        mixingQuality: 1.2,
        masteringQuality: 1.2
      }
    },
    {
      id: 'live_room',
      name: 'Live Room',
      description: 'Add a spacious live room for full band recordings',
      cost: 75000,
      requirements: {
        level: 7,
        reputation: 75
      },
      benefits: {
        recordingCapacity: 8,
        acousticQuality: 1.3
      }
    },
    {
      id: 'isolation_booth',
      name: 'Isolation Booth',
      description: 'Add an isolation booth for vocal and instrument recording',
      cost: 30000,
      requirements: {
        level: 3,
        reputation: 25
      },
      benefits: {
        vocalQuality: 1.2,
        isolationQuality: 1.3
      }
    },
    {
      id: 'lounge',
      name: 'Artist Lounge',
      description: 'Add a comfortable lounge for artists to relax and prepare',
      cost: 25000,
      requirements: {
        level: 4,
        reputation: 30
      },
      benefits: {
        artistMood: 1.2,
        preparationQuality: 1.2
      }
    }
  ],
  marketTrends: {
    currentTrends: [],
    historicalTrends: []
  },
  venues: [
    {
      id: 'small_club',
      name: 'The Local Dive',
      city: 'Anytown',
      capacity: 150,
      baseTicketPrice: 10,
      reputationRequirement: 0,
      genrePreferences: [
        { genre: 'Rock', multiplier: 1.2 },
        { genre: 'Pop', multiplier: 0.8 }
      ],
      rentalCost: 500
    },
    {
      id: 'medium_hall',
      name: 'City Music Hall',
      city: 'Metropolis',
      capacity: 500,
      baseTicketPrice: 25,
      reputationRequirement: 100,
      genrePreferences: [
        { genre: 'Pop', multiplier: 1.2 },
        { genre: 'Electronic', multiplier: 1.1 }
      ],
      rentalCost: 2000
    }
  ],
  tours: []
};

export function useGameState(): {
  gameState: GameState;
  focusAllocation: FocusAllocation;
  setFocusAllocation: (newFocus: FocusAllocation) => void;
  updateGameState: (updater: (prevState: GameState) => GameState) => void;
  startNewGame: () => void;
  advanceDay: () => void;
  levelUpModalData: LevelUpDetails | null;
  triggerLevelUpModal: (details: LevelUpDetails) => void;
  clearLevelUpModal: () => void;
  bandManagement: ReturnType<typeof useBandManagement>;
  studioExpansion: ReturnType<typeof useStudioExpansion>;
  staffManagement: ReturnType<typeof useStaffManagement>;
  projectManagement: ReturnType<typeof useProjectManagement>;
} {
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

  const updateGameState = useCallback((updater: GameState | ((prevState: GameState) => GameState)) => {
    setGameState(prevState => {
      const newState = typeof updater === 'function' ? (updater as (prevState: GameState) => GameState)(prevState) : updater;
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

  // Initialize hooks
  const bandManagement = useBandManagement();
  const studioExpansion = useStudioExpansion(gameState, updateGameState);
  const staffManagement = useStaffManagement();
  const projectManagement = useProjectManagement({ gameState, setGameState: updateGameState });

  // Process tour income at the start of each day
  useEffect(() => {
    const processTourIncome = () => {
      setGameState(prev => {
        const updatedBands = prev.playerBands.map(band => {
          if (band.tourStatus.isOnTour) {
            const updatedDaysRemaining = band.tourStatus.daysRemaining - 1;
            
            return {
              ...band,
              tourStatus: {
                ...band.tourStatus,
                daysRemaining: updatedDaysRemaining,
                isOnTour: updatedDaysRemaining > 0
              }
            };
          }
          return band;
        });

        const totalTourIncome = updatedBands.reduce((total, band) => {
          if (band.tourStatus.isOnTour) {
            return total + band.tourStatus.dailyIncome;
          }
          return total;
        }, 0);

        return {
          ...prev,
          playerBands: updatedBands,
          money: prev.money + totalTourIncome
        };
      });
    };

    processTourIncome();
  }, [gameState.currentDay]);

  return {
    gameState,
    focusAllocation: gameState.focusAllocation,
    setFocusAllocation,
    updateGameState,
    startNewGame,
    advanceDay,
    levelUpModalData,
    triggerLevelUpModal,
    clearLevelUpModal,
    bandManagement,
    studioExpansion,
    staffManagement,
    projectManagement
  };
}
