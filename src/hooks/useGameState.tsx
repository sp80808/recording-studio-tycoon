import { useState, useEffect } from 'react';
import { GameState, FocusAllocation, PlayerData } from '@/types/game'; // Added PlayerData for skills
import { generateNewProjects, generateCandidates } from '@/utils/projectUtils';
import { generateSessionMusicians } from '@/utils/bandUtils';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { initializeSkillsPlayer } from '@/utils/skillUtils'; // Import skill initializer

interface EraInitOptions {
  startingMoney: number;
  selectedEra: string;
  eraStartYear: number;
  currentYear: number;
  equipmentMultiplier: number;
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const createDefaultGameState = (options?: Partial<EraInitOptions>): GameState => ({
    money: options?.startingMoney || 2000,
    reputation: 10,
    currentDay: 2,
    currentYear: options?.currentYear || 1960, // Start in 1960s era
    currentEra: 'analog60s', // Start with analog era
    selectedEra: options?.selectedEra || 'analog60s',
    eraStartYear: options?.eraStartYear || 1960,
    equipmentMultiplier: options?.equipmentMultiplier || 0.3, // Lower prices in 1960s
    playerData: {
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 3,
      dailyWorkCapacity: 5,
      reputation: 10, // Add reputation to PlayerData
      attributes: {
        focusMastery: 1,
        creativeIntuition: 1,
        technicalAptitude: 1,
        businessAcumen: 1
      },
      skills: initializeSkillsPlayer(), // Initialize player skills
    },
    studioSkills: { // This seems to be old/genre-specific skills, distinct from new player skills
      Rock: { name: 'Rock', level: 1, xp: 0, xpToNext: 20 },
      Pop: { name: 'Pop', level: 1, xp: 0, xpToNext: 20 },
      Electronic: { name: 'Electronic', level: 1, xp: 0, xpToNext: 20 },
      Hiphop: { name: 'Hip-hop', level: 1, xp: 0, xpToNext: 20 },
      Acoustic: { name: 'Acoustic', level: 1, xp: 0, xpToNext: 20 }
    },
    ownedUpgrades: [],
    ownedEquipment: [
      {
        id: 'basic_mic',
        name: 'Basic USB Mic',
        category: 'microphone',
        price: 0,
        description: 'Standard starter microphone',
        bonuses: { qualityBonus: 0 },
        icon: '🎤',
        condition: 100 // Add default condition for starting equipment
      },
      {
        id: 'basic_monitors',
        name: 'Basic Speakers',
        category: 'monitor',
        price: 0,
        description: 'Standard studio monitors',
        bonuses: { qualityBonus: 0 },
        icon: '🔊',
        condition: 100 // Add default condition for starting equipment
      }
    ],
    availableProjects: [],
    activeProject: null, // Keep for backward compatibility
    // Multi-project system
    activeProjects: [], // New multi-project array
    maxConcurrentProjects: 2, // Starting capacity
    hiredStaff: [],
    availableCandidates: [],
    lastSalaryDay: 0,
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
      lastChartUpdate: 0
    },
    researchedMods: [],
    // Automation system
    automation: {
      enabled: false,
      mode: 'off',
      settings: {
        priorityMode: 'balanced',
        minStaffPerProject: 1,
        maxStaffPerProject: 3,
        workloadDistribution: 'adaptive',
        pauseOnIssues: true,
        notifyOnMilestones: true
      },
      efficiency: {}
    },
    // Animation state tracking
    animations: {
      projects: {},
      staff: {},
      globalEffects: {
        studioActivity: 0,
        projectTransitions: {},
        automationPulse: false,
        lastGlobalUpdate: Date.now()
      }
    }
  });

  const initializeGameState = (options?: Partial<EraInitOptions>): GameState => {
    const newGameState = createDefaultGameState(options);
    const currentEra = newGameState.currentEra;
    const initialProjects = generateNewProjects(3, 1, currentEra);
    const initialCandidates = generateCandidates(3);
    const initialSessionMusicians = generateSessionMusicians(5);
    
    // Set initial progression-based values
    const maxConcurrentProjects = ProgressionSystem.getMaxConcurrentProjects(newGameState);
    
    return {
      ...newGameState,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates,
      availableSessionMusicians: initialSessionMusicians,
      maxConcurrentProjects
    };
  };

  // Update game state to reflect progression changes
  const updateGameStateWithProgression = (newGameState: GameState): GameState => {
    const maxConcurrentProjects = ProgressionSystem.getMaxConcurrentProjects(newGameState);
    const isMultiProjectUnlocked = ProgressionSystem.shouldUnlockMultiProject(newGameState);
    
    return {
      ...newGameState,
      maxConcurrentProjects,
      automation: {
        ...newGameState.automation!,
        // Enable basic automation when multi-project is unlocked
        enabled: isMultiProjectUnlocked && newGameState.automation!.enabled,
        mode: isMultiProjectUnlocked && newGameState.automation!.mode === 'off' 
          ? 'basic' 
          : newGameState.automation!.mode
      }
    };
  };

  // Initialize with default state if no era is selected (for backward compatibility)
  useEffect(() => {
    if (!gameState) {
      const defaultState = initializeGameState();
      setGameState(defaultState);
    }
  }, []);

  return {
    gameState: gameState || createDefaultGameState(),
    setGameState: (state: GameState | ((prev: GameState) => GameState)) => {
      if (typeof state === 'function') {
        setGameState(prev => {
          const newState = state(prev || createDefaultGameState());
          return updateGameStateWithProgression(newState);
        });
      } else {
        setGameState(updateGameStateWithProgression(state));
      }
    },
    focusAllocation,
    setFocusAllocation,
    initializeGameState
  };
};
