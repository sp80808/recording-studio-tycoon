import { useState, useEffect } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { generateNewProjects, generateCandidates } from '@/utils/projectUtils';
import { generateSessionMusicians } from '@/utils/bandUtils';

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
      }
    },
    studioSkills: {
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
        icon: '🎤'
      },
      {
        id: 'basic_monitors',
        name: 'Basic Speakers',
        category: 'monitor',
        price: 0,
        description: 'Standard studio monitors',
        bonuses: { qualityBonus: 0 },
        icon: '🔊'
      }
    ],
    availableProjects: [],
    activeProject: null,
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
    }
  });

  const initializeGameState = (options?: Partial<EraInitOptions>): GameState => {
    const newGameState = createDefaultGameState(options);
    const currentEra = newGameState.currentEra;
    const initialProjects = generateNewProjects(3, 1, currentEra);
    const initialCandidates = generateCandidates(3);
    const initialSessionMusicians = generateSessionMusicians(5);
    
    return {
      ...newGameState,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates,
      availableSessionMusicians: initialSessionMusicians
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
        setGameState(prev => state(prev || createDefaultGameState()));
      } else {
        setGameState(state);
      }
    },
    focusAllocation,
    setFocusAllocation,
    initializeGameState
  };
};
