import { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerData } from '@/types/game';
import { saveGame, loadGame, setupAutoSave } from '@/utils/saveLoadUtils';
import { generateNewProjects } from '@/utils/projectUtils';

const INITIAL_PLAYER_DATA: PlayerData = {
  money: 10000,
  reputation: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  perkPoints: 0,
  attributes: {
    creativity: 1,
    technical: 1,
    business: 1,
    charisma: 1, // Added
    creativeIntuition: 1, // Added
    technicalAptitude: 1, // Added
  },
  dailyWorkCapacity: 100
};

const INITIAL_GAME_STATE: GameState = {
  // Properties from PlayerData (already part of INITIAL_PLAYER_DATA)
  playerData: INITIAL_PLAYER_DATA,

  // Core game state
  currentDay: 1,
  
  // Player skills and progression (simplified for initial state)
  player: {
    era: 'streaming', // Changed from 'modern' to 'streaming'
    skills: [
      { type: 'recording', level: 1 },
      { type: 'mixing', level: 1 },
      { type: 'mastering', level: 1 },
    ],
  },
  studioSkills: {
    recording: { level: 1, xp: 0, xpToNextLevel: 100 },
    mixing: { level: 1, xp: 0, xpToNextLevel: 100 },
    mastering: { level: 1, xp: 0, xpToNextLevel: 100 },
  },

  // Studio assets
  ownedEquipment: [],
  ownedUpgrades: [],
  studioLevel: 1,
  studioReputation: 0,
  studioSpecialization: [],
  studioChallenges: [],
  studioAchievements: [],

  // Projects and Bands
  projects: [],
  availableProjects: [],
  activeProject: null,
  completedProjects: [],
  bands: [],
  playerBands: [],
  availableSessionMusicians: [],
  activeOriginalTrack: null,

  // Staff
  staff: [],
  availableCandidates: [],
  lastSalaryDay: 0,

  // Era and Time
  currentEra: 'modern', // Default to modern era ID
  currentYear: 2024, // Default start year for modern era
  selectedEra: 'modern', // Default selected era
  eraStartYear: 2024, // Default era start year
  equipmentMultiplier: 1.0, // Default multiplier

  // Notifications and Events
  notifications: [],
  events: [],

  // Charts System (optional, initialize as undefined or empty)
  chartsData: {
    charts: [],
    contactedArtists: [],
    marketTrends: [],
    discoveredArtists: [],
    lastChartUpdate: 0,
  },
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedState = loadGame();
    return savedState || INITIAL_GAME_STATE;
  });

  // Setup autosave
  useEffect(() => {
    const cleanup = setupAutoSave(gameState);
    return cleanup;
  }, [gameState]);

  const updateGameState = useCallback((updater: (prevState: GameState) => GameState) => {
    setGameState(prevState => {
      const newState = updater(prevState);
      saveGame(newState);
      return newState;
    });
  }, []);

  const startNewGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    saveGame(INITIAL_GAME_STATE);
  }, []);

  const advanceDay = useCallback(() => {
    updateGameState(prevState => {
      const newState = { ...prevState, currentDay: prevState.currentDay + 1 };
      
      // Generate new projects if needed
      if (newState.projects.length < 3) {
        const newProjects = generateNewProjects(newState);
        newState.projects = [...newState.projects, ...newProjects];
      }

      // Update active project if exists
      const project = newState.activeProject; // Use 'project' to match error messages
      if (project) { 
        // At this point, 'project' should be of type 'Project', not 'Project | null'
        const currentStageData = project.stages[project.currentStage];
        
        // Check if stage is completed
        if (currentStageData.workUnitsCompleted >= currentStageData.workUnitsBase) {
          if (project.currentStage < project.stages.length - 1) {
            // Move to next stage
            project.currentStage++; // This would be around line 179
          } else {
            // Complete project
            project.isCompleted = true;
            project.endDate = newState.currentDay;
            
            // Award rewards
            if (project.payoutBase) {
              newState.playerData.money += project.payoutBase;
            }
            if (project.repGainBase) {
              newState.playerData.reputation += project.repGainBase;
            }
            
            // Clear active project on newState
            newState.activeProject = null;
          }
        }
      }

      return newState;
    });
  }, [updateGameState]);

  const startProject = useCallback((projectId: string) => {
    updateGameState(prevState => {
      const project = prevState.projects.find(p => p.id === projectId);
      if (!project) return prevState;

      return {
        ...prevState,
        activeProject: project,
        projects: prevState.projects.filter(p => p.id !== projectId)
      };
    });
  }, [updateGameState]);

  const addWorkToProject = useCallback((workType: 'creativity' | 'technical', value: number) => {
    updateGameState(prevState => {
      if (!prevState.activeProject) return prevState;

      const newState = { ...prevState };
      const project = newState.activeProject;
      const currentStage = project.stages[project.currentStage];
      
      currentStage.workUnitsCompleted += value;
      
      return newState;
    });
  }, [updateGameState]);

  return {
    gameState,
    updateGameState,
    startNewGame,
    advanceDay,
    startProject,
    addWorkToProject
  };
}
