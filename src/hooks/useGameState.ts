import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PlayerData, FocusAllocation, StudioSkill, Project, LevelUpDetails, StaffMember, StudioSkillType } from '@/types/game'; // Added StudioSkillType
import { saveGame, loadGame, startAutoSave, stopAutoSave } from '@/utils/saveLoadUtils';
import { generateNewProjects } from '@/utils/projectUtils';
// import { Band, OriginalTrackProject } from '@/types/bands'; // Band is re-exported from game.ts
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
  // skills in PlayerData refers to player's proficiency levels in StudioSkillType, not the StudioSkill objects themselves
  skills: { 
    recording: 1,
    mixing: 1,
    mastering: 1,
    production: 1,
    marketing: 1,
    composition: 1, // Added
    soundDesign: 1, // Added
    sequencing: 1,  // Added
  },
  xp: 0,
  xpToNextLevel: 100,
  perkPoints: 0,
  attributes: INITIAL_PLAYER_ATTRIBUTES,
  dailyWorkCapacity: 100,
  lastMinigameType: undefined, // Initialize explicitly
};

// This is for the studio's overall skill levels/capabilities, separate from player's skills.
const INITIAL_STUDIO_SKILLS: Record<StudioSkillType, StudioSkill> = {
  recording: { name: 'recording', level: 1, experience: 0, multiplier: 1.0 },
  mixing: { name: 'mixing', level: 1, experience: 0, multiplier: 1.0 },
  mastering: { name: 'mastering', level: 1, experience: 0, multiplier: 1.0 },
  production: { name: 'production', level: 1, experience: 0, multiplier: 1.0 },
  marketing: { name: 'marketing', level: 1, experience: 0, multiplier: 1.0 },
  composition: { name: 'composition', level: 1, experience: 0, multiplier: 1.0 }, // Added
  soundDesign: { name: 'soundDesign', level: 1, experience: 0, multiplier: 1.0 }, // Added
  sequencing: { name: 'sequencing', level: 1, experience: 0, multiplier: 1.0 },   // Added
};

const INITIAL_FOCUS_ALLOCATION: FocusAllocation = {
  performance: 33,
  soundCapture: 34,
  layering: 33,
  creativity: 0, // Added based on type
  technical: 0,  // Added based on type
  business: 0,   // Added based on type
};

const INITIAL_GAME_STATE: GameState = {
  money: 10000,
  reputation: 0,
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
  levelUpDetails: null,
  availableExpansions: [
    { id: 'control_room', name: 'Control Room', description: 'Add a professional control room for better mixing and mastering', cost: 50000, requirements: { level: 5, reputation: 50 }, benefits: { mixingQuality: 1.2, masteringQuality: 1.2 }},
    { id: 'live_room', name: 'Live Room', description: 'Add a spacious live room for full band recordings', cost: 75000, requirements: { level: 7, reputation: 75 }, benefits: { recordingCapacity: 8, acousticQuality: 1.3 }},
    { id: 'isolation_booth', name: 'Isolation Booth', description: 'Add an isolation booth for vocal and instrument recording', cost: 30000, requirements: { level: 3, reputation: 25 }, benefits: { vocalQuality: 1.2, isolationQuality: 1.3 }},
    { id: 'lounge', name: 'Artist Lounge', description: 'Add a comfortable lounge for artists to relax and prepare', cost: 25000, requirements: { level: 4, reputation: 30 }, benefits: { artistMood: 1.2, preparationQuality: 1.2 }}
  ],
  marketTrends: {
    currentTrends: [],
    historicalTrends: []
  },
  venues: [
    { id: 'small_club', name: 'The Local Dive', city: 'Anytown', capacity: 150, baseTicketPrice: 10, reputationRequirement: 0, genrePreferences: [ { genre: 'Rock', multiplier: 1.2 }, { genre: 'Pop', multiplier: 0.8 } ], rentalCost: 500 },
    { id: 'medium_hall', name: 'City Music Hall', city: 'Metropolis', capacity: 500, baseTicketPrice: 25, reputationRequirement: 100, genrePreferences: [ { genre: 'Pop', multiplier: 1.2 }, { genre: 'Electronic', multiplier: 1.1 } ], rentalCost: 2000 }
  ],
  tours: [],
  lastMinigameTriggers: {}, // Initialize
  unlockedFeatures: [], // Initialize
  availableTraining: [], // Initialize
  completedProjects: [], // Initialize
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
        if (!savedGame.playerData || !savedGame.playerData.attributes) {
            savedGame.playerData = {
                ...INITIAL_PLAYER_DATA, 
                ...(savedGame.playerData || {}), 
                attributes: savedGame.playerData?.attributes || INITIAL_PLAYER_ATTRIBUTES,
            };
        }
        // Ensure new studio skills are present in loaded game
        const defaultSkills = Object.keys(INITIAL_STUDIO_SKILLS) as StudioSkillType[];
        defaultSkills.forEach(skillKey => {
            if (!savedGame.studioSkills[skillKey]) {
                savedGame.studioSkills[skillKey] = INITIAL_STUDIO_SKILLS[skillKey];
            }
            if (savedGame.playerData.skills && !savedGame.playerData.skills[skillKey]) {
                savedGame.playerData.skills[skillKey] = 1; // Default player proficiency
            }
        });
        if (!savedGame.marketTrends) { // Ensure marketTrends is initialized
            savedGame.marketTrends = { currentTrends: [], historicalTrends: [] };
        }
        if (!savedGame.venues) savedGame.venues = INITIAL_GAME_STATE.venues;
        if (!savedGame.tours) savedGame.tours = INITIAL_GAME_STATE.tours;
        if (!savedGame.lastMinigameTriggers) savedGame.lastMinigameTriggers = {};
        if (!savedGame.unlockedFeatures) savedGame.unlockedFeatures = [];
        if (!savedGame.availableTraining) savedGame.availableTraining = [];
        if (!savedGame.completedProjects) savedGame.completedProjects = [];


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
    updateGameState(INITIAL_GAME_STATE); // Use updateGameState to ensure saving
    saveGame(INITIAL_GAME_STATE); // Explicitly save the new initial state
  }, [updateGameState]);

  const advanceDay = useCallback(() => {
    updateGameState(prevState => {
      let newState = { ...prevState, currentDay: prevState.currentDay + 1 };
      
      if (newState.availableProjects.length < 5) { 
        const projectsToGenerate = 5 - newState.availableProjects.length;
        const newProjects = generateNewProjects(projectsToGenerate, newState.playerData.level, newState.currentEra);
        newState.availableProjects = [...newState.availableProjects, ...newProjects];
      }

      if (newState.activeProject) {
        const activeProjectCopy = { ...newState.activeProject };
        if (activeProjectCopy.currentStageIndex < activeProjectCopy.stages.length) {
            const currentStageData = activeProjectCopy.stages[activeProjectCopy.currentStageIndex];
            if (currentStageData.workUnitsCompleted >= (currentStageData.workUnitsRequired || currentStageData.workUnitsBase) ) {
                if (activeProjectCopy.currentStageIndex < activeProjectCopy.stages.length - 1) {
                    newState.activeProject = {
                    ...activeProjectCopy,
                    currentStageIndex: activeProjectCopy.currentStageIndex + 1
                    };
                } else { // Project completed
                    const completedProject = { ...activeProjectCopy, isCompleted: true, endDate: newState.currentDay };
                    
                    const newPlayerData = { ...newState.playerData };
                    newState.money += completedProject.payoutBase; 
                    newPlayerData.reputation += completedProject.repGainBase; 
                    
                    newState = {
                    ...newState,
                    playerData: newPlayerData,
                    completedProjects: [...(newState.completedProjects || []), completedProject],
                    activeProject: null,
                    };
                }
            }
        }
      }
      // Process tour income
      const updatedBands = newState.playerBands.map(band => {
        if (band.tourStatus.isOnTour) {
          const updatedDaysRemaining = band.tourStatus.daysRemaining - 1;
          const stillOnTour = updatedDaysRemaining > 0;
          if (stillOnTour) {
            newState.money += band.tourStatus.dailyIncome;
          }
          return {
            ...band,
            tourStatus: {
              ...band.tourStatus,
              daysRemaining: updatedDaysRemaining,
              isOnTour: stillOnTour,
            }
          };
        }
        return band;
      });
      newState.playerBands = updatedBands;

      return newState;
    });
  }, [updateGameState]);
  
  const [levelUpModalData, setLevelUpModalData] = useState<LevelUpDetails | null>(null);

  const triggerLevelUpModal = useCallback((details: LevelUpDetails) => {
    setLevelUpModalData(details);
  }, []);

  const clearLevelUpModal = useCallback(() => {
    setLevelUpModalData(null);
  }, []);

  const bandManagement = useBandManagement();
  const studioExpansion = useStudioExpansion(gameState, updateGameState);
  const staffManagement = useStaffManagement();
  const projectManagement = useProjectManagement({ gameState, setGameState: updateGameState });
  
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
