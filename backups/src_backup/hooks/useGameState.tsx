import { useState, useEffect, useMemo, useCallback, Dispatch, SetStateAction } from 'react';
import { GameState, FocusAllocation, STUDIO_SKILLS } from '@/types/game';
import { generateNewProjects, generateCandidates } from '@/utils/projectUtils';
import { initializeStudioSkill } from '@/utils/progressionUtils';

const INITIAL_GAME_STATE: GameState = {
  money: 2000,
  reputation: 10,
  currentDay: 2,
  playerData: {
    name: "",
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    money: 2000,
    reputation: 10,
    attributes: {
      creativity: 10,
      technical: 10,
      charisma: 10,
      business: 10,
      luck: 10,
      focusMastery: 0,
      creativeIntuition: 0,
      technicalAptitude: 0,
      businessAcumen: 0
    },
    dailyWorkCapacity: 5,
    attributePoints: 0,
    initialAttributePoints: 5,
    perkPoints: 0,
    unlockedPerks: [],
    characterCreated: false,
    trainingHistory: [],
    minigameHistory: [],
    trainingCooldown: 0
  },
  studioSkills: Object.keys(STUDIO_SKILLS).reduce((acc, skillId) => ({
    ...acc,
    [skillId]: initializeStudioSkill(skillId)
  }), {}),
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
  unlockedFeatures: [],
  availableTechniques: [],
  availableTraining: [],
  milestoneProgress: {
    lastMilestoneLevel: 0,
    nextMilestoneLevel: 5
  }
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const initGame = useCallback(() => {
    const initialProjects = generateNewProjects(3);
    const initialCandidates = generateCandidates(3);
    setGameState(prev => ({
      ...prev,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates
    }));
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const updateGameState = useCallback((updater: SetStateAction<GameState>) => {
    setGameState(updater);
  }, []);

  const updateFocusAllocation = useCallback((newAllocation: FocusAllocation) => {
    setFocusAllocation(newAllocation);
  }, []);

  const memoizedGameState = useMemo(() => gameState, [gameState]);
  const memoizedFocusAllocation = useMemo(() => focusAllocation, [focusAllocation]);

  return {
    gameState: memoizedGameState,
    setGameState: updateGameState,
    focusAllocation: memoizedFocusAllocation,
    setFocusAllocation: updateFocusAllocation
  };
};
