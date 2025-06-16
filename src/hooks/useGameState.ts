import { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerData, FocusAllocation, StudioSkill, LevelUpDetails, StudioSkillType } from '@/types/game';
import { saveGame, loadGame, startAutoSave, stopAutoSave } from '@/utils/saveLoadUtils';
import { generateNewProjects } from '@/utils/projectUtils';
import { useBandManagement } from './useBandManagement';
import { useStudioExpansion } from './useStudioExpansion';
import { useStaffManagement } from './useStaffManagement';
import { useProjectManagement } from './useProjectManagement';
import { relationshipService } from '@/services/relationshipService'; // Import relationshipService

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
  creativity: 5,
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
    recording: 1, mixing: 1, mastering: 1, production: 1, marketing: 1,
    composition: 1, soundDesign: 1, sequencing: 1,
  },
  xp: 0,
  xpToNextLevel: 100,
  perkPoints: 0,
  attributes: INITIAL_PLAYER_ATTRIBUTES,
  dailyWorkCapacity: 100,
  lastMinigameType: undefined,
};

const INITIAL_STUDIO_SKILLS: Record<StudioSkillType, StudioSkill> = {
  recording: { name: 'recording', level: 1, experience: 0, multiplier: 1.0 },
  mixing: { name: 'mixing', level: 1, experience: 0, multiplier: 1.0 },
  mastering: { name: 'mastering', level: 1, experience: 0, multiplier: 1.0 },
  production: { name: 'production', level: 1, experience: 0, multiplier: 1.0 },
  marketing: { name: 'marketing', level: 1, experience: 0, multiplier: 1.0 },
  composition: { name: 'composition', level: 1, experience: 0, multiplier: 1.0 },
  soundDesign: { name: 'soundDesign', level: 1, experience: 0, multiplier: 1.0 },
  sequencing: { name: 'sequencing', level: 1, experience: 0, multiplier: 1.0 },
};

const INITIAL_FOCUS_ALLOCATION: FocusAllocation = {
  performance: 33, soundCapture: 34, layering: 33,
  creativity: 0, technical: 0, business: 0,
};

const INITIAL_GAME_STATE: GameState = {
  money: 10000, reputation: 0, playerData: INITIAL_PLAYER_DATA, currentDay: 1,
  studioSkills: INITIAL_STUDIO_SKILLS, ownedEquipment: [], ownedUpgrades: [],
  availableProjects: [], activeProject: null, hiredStaff: [], availableCandidates: [],
  lastSalaryDay: 0, currentEra: 'modern', currentYear: 2024, selectedEra: 'modern',
  eraStartYear: 2024, equipmentMultiplier: 1.0, notifications: [], bands: [], playerBands: [],
  availableSessionMusicians: [], activeOriginalTrack: null, songs: [], // Initialize songs array
  chartsData: { charts: [], contactedArtists: [], marketTrends: [], discoveredArtists: [], lastChartUpdate: 0, },
  focusAllocation: INITIAL_FOCUS_ALLOCATION, levelUpDetails: null,
  availableExpansions: [
    { id: 'control_room', name: 'Control Room', description: 'Add a professional control room for better mixing and mastering', cost: 50000, requirements: { level: 5, reputation: 50 }, benefits: { mixingQuality: 1.2, masteringQuality: 1.2 }},
    { id: 'live_room', name: 'Live Room', description: 'Add a spacious live room for full band recordings', cost: 75000, requirements: { level: 7, reputation: 75 }, benefits: { recordingCapacity: 8, acousticQuality: 1.3 }},
  ],
  marketTrends: { currentTrends: [], historicalTrends: [] },
  venues: [
    { id: 'small_club', name: 'The Local Dive', city: 'Anytown', capacity: 150, baseTicketPrice: 10, reputationRequirement: 0, genrePreferences: [ { genre: 'Rock', multiplier: 1.2 }, { genre: 'Pop', multiplier: 0.8 } ], rentalCost: 500 },
  ],
  tours: [], lastMinigameTriggers: {}, unlockedFeatures: [], availableTraining: [], completedProjects: [],
  clients: [],
  recordLabels: [],
  activePREvents: [],
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
        const mergedState: GameState = {
            ...INITIAL_GAME_STATE,
            ...savedGame,
            playerData: {
                ...INITIAL_PLAYER_DATA,
                ...(savedGame.playerData || {}),
                attributes: savedGame.playerData?.attributes || INITIAL_PLAYER_ATTRIBUTES,
            },
            studioSkills: {
                ...INITIAL_STUDIO_SKILLS,
                ...(savedGame.studioSkills || {}),
            },
            chartsData: {
                charts: savedGame.chartsData?.charts || [],
                contactedArtists: savedGame.chartsData?.contactedArtists || [],
                marketTrends: savedGame.chartsData?.marketTrends || [],
                discoveredArtists: savedGame.chartsData?.discoveredArtists || [],
                lastChartUpdate: savedGame.chartsData?.lastChartUpdate || 0,
            },
            marketTrends: savedGame.marketTrends || { currentTrends: [], historicalTrends: [] },
            venues: savedGame.venues || INITIAL_GAME_STATE.venues,
            tours: savedGame.tours || INITIAL_GAME_STATE.tours,
            lastMinigameTriggers: savedGame.lastMinigameTriggers || {},
            unlockedFeatures: savedGame.unlockedFeatures || [],
            availableTraining: savedGame.availableTraining || [],
            completedProjects: savedGame.completedProjects || [],
            clients: savedGame.clients || [],
            recordLabels: savedGame.recordLabels || [],
            activePREvents: savedGame.activePREvents || [],
            playerBands: savedGame.playerBands || [],
            bands: savedGame.bands || [],
            availableSessionMusicians: savedGame.availableSessionMusicians || [],
            songs: savedGame.songs || [], // Initialize songs from saved game
        };

        // Ensure all individual skills within studioSkills are initialized if missing
        const defaultSkills = Object.keys(INITIAL_STUDIO_SKILLS) as StudioSkillType[];
        defaultSkills.forEach(skillKey => {
            if (!mergedState.studioSkills[skillKey]) {
                mergedState.studioSkills[skillKey] = INITIAL_STUDIO_SKILLS[skillKey];
            }
            if (mergedState.playerData.skills && !mergedState.playerData.skills[skillKey]) {
                mergedState.playerData.skills[skillKey] = 1; // Default level for player skills
            }
        });

        return mergedState;
    }
    return INITIAL_GAME_STATE;
  });

  useEffect(() => { if (typeof window !== 'undefined') window.gameState = gameState; }, [gameState]);
  useEffect(() => { startAutoSave(); return stopAutoSave; }, []);

  const updateGameState = useCallback((updater: GameState | ((prevState: GameState) => GameState)) => {
    setGameState(prevState => {
      const newState = typeof updater === 'function' ? (updater as (prevState: GameState) => GameState)(prevState) : updater;
      saveGame(newState);
      return newState;
    });
  }, []);

  const setFocusAllocation = useCallback((newFocus: FocusAllocation) => {
    updateGameState(prevState => ({ ...prevState, focusAllocation: newFocus, }));
  }, [updateGameState]);

  const startNewGame = useCallback(() => {
    updateGameState(INITIAL_GAME_STATE);
    // saveGame(INITIAL_GAME_STATE); // updateGameState already calls saveGame
  }, [updateGameState]);

  const advanceDay = useCallback(() => {
    updateGameState(prevState => {
      let newState = { ...prevState, currentDay: prevState.currentDay + 1 };

      if (newState.availableProjects.length < 5) {
        const projectsToGenerate = 5 - newState.availableProjects.length;
        // Pass gameState to generateNewProjects
        const newProjects = generateNewProjects(projectsToGenerate, newState.playerData.level, newState.currentEra, newState);
        newState.availableProjects = [...newState.availableProjects, ...newProjects];
      }

      if (newState.activeProject) {
        const activeProjectCopy = { ...newState.activeProject };
        if (activeProjectCopy.currentStageIndex < activeProjectCopy.stages.length) {
            const currentStageData = activeProjectCopy.stages[activeProjectCopy.currentStageIndex];
            if (currentStageData.workUnitsCompleted >= (currentStageData.workUnitsRequired || currentStageData.workUnitsBase) ) {
                if (activeProjectCopy.currentStageIndex < activeProjectCopy.stages.length - 1) {
                    newState.activeProject = { ...activeProjectCopy, currentStageIndex: activeProjectCopy.currentStageIndex + 1 };
                } else {
                    const completedProject = { ...activeProjectCopy, isCompleted: true, endDate: newState.currentDay };
                    const newPlayerData = { ...newState.playerData,
                                            money: newState.playerData.money + completedProject.payoutBase,
                                            reputation: newState.playerData.reputation + completedProject.repGainBase
                                          };
                    newState = {
                        ...newState,
                        playerData: newPlayerData,
                        // money: newState.money + completedProject.payoutBase, // Already updated in playerData
                        // reputation: newState.reputation + completedProject.repGainBase, // Already updated in playerData
                        completedProjects: [...(newState.completedProjects || []), completedProject],
                        activeProject: null,
                    };
                    relationshipService.handleProjectCompletion(completedProject, newState);
                }
            }
        }
      }
      const updatedBands = newState.playerBands.map(band => {
        if (band.tourStatus.isOnTour) {
          const updatedDaysRemaining = band.tourStatus.daysRemaining - 1;
          const stillOnTour = updatedDaysRemaining > 0;
          if (stillOnTour) newState.money += band.tourStatus.dailyIncome; // Direct money update
          return { ...band, tourStatus: { ...band.tourStatus, daysRemaining: updatedDaysRemaining, isOnTour: stillOnTour, } };
        }
        return band;
      });
      // The logic for tour income is handled by directly adding to newState.money when a band is still on tour.
      // The previous more complex block for totalTourIncome was not fully implemented and can be removed.
      newState.playerBands = updatedBands;
      return newState;
    });
  }, [updateGameState]);

  const [levelUpModalData, setLevelUpModalData] = useState<LevelUpDetails | null>(null);
  const triggerLevelUpModal = useCallback((details: LevelUpDetails) => setLevelUpModalData(details), []);
  const clearLevelUpModal = useCallback(() => setLevelUpModalData(null), []);

  // Pass gameState and updateGameState to useBandManagement
  const bandManagement = useBandManagement(gameState, updateGameState);
  const studioExpansion = useStudioExpansion(gameState, updateGameState);
  // Assuming useStaffManagement also needs similar treatment if it calls useGameState internally
  // For now, leaving as is, but this is a potential area to check if errors persist or if it also causes cycles.
  const staffManagement = useStaffManagement(); // This might be the next source of error if it also calls useGameState()
  const projectManagement = useProjectManagement({ gameState, setGameState: updateGameState });

  return {
    gameState, focusAllocation: gameState.focusAllocation, setFocusAllocation, updateGameState,
    startNewGame, advanceDay, levelUpModalData, triggerLevelUpModal, clearLevelUpModal,
    bandManagement, studioExpansion, staffManagement, projectManagement
  };
}
