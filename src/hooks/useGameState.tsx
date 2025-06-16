import { useState, useEffect } from 'react';
import { GameState, FocusAllocation, StudioSkillType, StudioSkill, PlayerData, Equipment, GameNotification, Band, SessionMusician, OriginalTrackProject, AggregatedPerkModifiers, StaffMember } from '../types/game';
import { generateNewProjects, generateCandidates } from '../utils/projectUtils';
import { generateSessionMusicians } from '../utils/bandUtils';

const initialStudioSkills: Record<StudioSkillType, StudioSkill> = {
  recording: { name: 'recording', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  mixing: { name: 'mixing', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  mastering: { name: 'mastering', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  production: { name: 'production', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  marketing: { name: 'marketing', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  composition: { name: 'composition', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  soundDesign: { name: 'soundDesign', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
  sequencing: { name: 'sequencing', level: 1, experience: 0, multiplier: 1, xpToNextLevel: 100 },
};

interface EraInitOptions {
  startingMoney: number;
  selectedEra: string;
  eraStartYear: number;
  currentYear: number;
  equipmentMultiplier: number;
}

const createDefaultPlayerData = (): PlayerData => ({
  name: 'Studio Owner',
  level: 1,
  experience: 0,
  money: 0,
  reputation: 10,
  skills: {
    recording: 0,
    mixing: 0,
    mastering: 0,
    production: 0,
    marketing: 0,
    composition: 0,
    soundDesign: 0,
    sequencing: 0,
  } as Record<StudioSkillType, number>,
  xp: 0,
  xpToNextLevel: 100,
  perkPoints: 3,
  attributePoints: 0,
  attributes: {
    focusMastery: 1,
    creativeIntuition: 1,
    technicalAptitude: 1,
    businessAcumen: 1,
    creativity: 10,
    technical: 10,
    business: 10,
    charisma: 5,
    luck: 5,
  },
  dailyWorkCapacity: 5,
  lastMinigameType: undefined,
});


export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 50,
    soundCapture: 50,
    layering: 50,
    creativity: 50, 
    technical: 50,
    business: 50,
  });

  const createDefaultGameState = (options?: Partial<EraInitOptions>): GameState => {
    console.log('createDefaultGameState: Options received', options);
    const newGameState: GameState = {
      money: options?.startingMoney || 2000,
      reputation: 10,
      currentDay: 1, 
      currentYear: options?.currentYear || 1960,
      currentEra: options?.selectedEra || 'analog60s', 
      selectedEra: options?.selectedEra || 'analog60s',
      eraStartYear: options?.eraStartYear || 1960,
      equipmentMultiplier: options?.equipmentMultiplier || 0.3,
      playerData: createDefaultPlayerData(), 
      studioSkills: { ...initialStudioSkills }, 
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
          condition: 100, 
        },
        {
          id: 'basic_monitors',
          name: 'Basic Speakers',
          category: 'monitor',
          price: 0,
          description: 'Standard studio monitors',
          bonuses: { qualityBonus: 0 },
          icon: '🔊',
          condition: 100, 
        }
      ] as Equipment[], 
      availableProjects: [],
      activeProject: null,
      hiredStaff: [] as StaffMember[], 
      availableCandidates: [] as StaffMember[], 
      lastSalaryDay: 0,
      notifications: [] as GameNotification[], 
      bands: [] as Band[], 
      playerBands: [] as Band[], 
      availableSessionMusicians: [] as SessionMusician[], 
      activeOriginalTrack: null as OriginalTrackProject | null, 
      chartsData: { 
        charts: [],
        contactedArtists: [],
        marketTrends: [],
        discoveredArtists: [],
        lastChartUpdate: 0,
      },
      focusAllocation: { 
        performance: 50,
        soundCapture: 50,
        layering: 50,
        creativity: 50,
        technical: 50,
        business: 50,
      },
      completedProjects: [],
      levelUpDetails: null,
      unlockedFeatures: [],
      availableTraining: [],
      availableExpansions: [],
      marketTrends: {
        currentTrends: [],
        historicalTrends: [],
      },
      venues: [],
      tours: [],
      lastMinigameTriggers: {},
      aggregatedPerkModifiers: {
        globalRecordingQualityModifier: 1.0,
        globalMixingQualityModifier: 1.0,
        globalMasteringQualityModifier: 1.0,
        contractPayoutModifier: 1.0,
        researchSpeedModifier: 1.0,
        staffHappinessModifier: 0,
        staffTrainingSpeedModifier: 1.0,
        marketingEffectivenessModifier: 1.0,
        projectAppealModifier: { 'all': 1.0 }, // This will be populated by allMusicGenres in studioUpgradeService
      } as AggregatedPerkModifiers, 
    };
    console.log('createDefaultGameState: New game state created', newGameState);
    return newGameState;
  };

  const initializeGameState = (options?: Partial<EraInitOptions>): GameState => {
    const newGameState = createDefaultGameState(options);
    const initialProjects = generateNewProjects(3, 1, newGameState.currentEra);
    const initialCandidates = generateCandidates(3, newGameState); // Pass newGameState
    const initialSessionMusicians = generateSessionMusicians(5); 
    
    const initializedState: GameState = { 
      ...newGameState,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates,
      availableSessionMusicians: initialSessionMusicians,
    };
    console.log('initializeGameState: Initialized game state', initializedState);
    return initializedState;
  };

  useEffect(() => {
    if (!gameState) {
      const defaultState = initializeGameState(); 
      setGameState(defaultState);
    }
  }, [gameState]); 

  return {
    gameState: gameState || createDefaultGameState(), 
    setGameState: (stateOrFn: GameState | ((prev: GameState) => GameState)) => {
      console.log('setGameState: Received update', stateOrFn);
      setGameState(prevState => {
        const baseState = prevState || createDefaultGameState(); 
        const newState = typeof stateOrFn === 'function' ? stateOrFn(baseState) : stateOrFn;
        console.log('setGameState: Previous state', baseState, 'New state', newState);
        return newState;
      });
    },
    focusAllocation,
    setFocusAllocation,
    initializeGameState, 
  };
};
