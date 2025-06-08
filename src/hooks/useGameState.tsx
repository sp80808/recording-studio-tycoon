import { useState, useEffect } from 'react';
import { GameState, FocusAllocation } from '@/types/game';
import { generateNewProjects, generateCandidates } from '@/utils/projectUtils';
import { generateSessionMusicians } from '@/utils/bandUtils';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: 2000,
    reputation: 10,
    currentDay: 2,
    playerData: {
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 3,
      dailyWorkCapacity: 5,
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
    activeOriginalTrack: null
  });

  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const initGame = () => {
    const initialProjects = generateNewProjects(3, 1); // Pass player level
    const initialCandidates = generateCandidates(3);
    const initialSessionMusicians = generateSessionMusicians(5);
    
    setGameState(prev => ({
      ...prev,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates,
      availableSessionMusicians: initialSessionMusicians
    }));
  };

  useEffect(() => {
    initGame();
  }, []);

  return {
    gameState,
    setGameState,
    focusAllocation,
    setFocusAllocation
  };
};
