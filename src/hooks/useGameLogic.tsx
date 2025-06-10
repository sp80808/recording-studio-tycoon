import { useState, useCallback } from 'react';
import { GameState, GameAction, Project, Staff, MinigameTrigger, GameEvent } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { getAvailableEquipmentForYear } from '@/data/eraEquipment';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';
import { useBandManagement } from '@/hooks/useBandManagement';
import { ArtistContact } from '@/types/charts';

interface GameLogicHook {
  gameState: GameState;
  dispatch: (action: GameAction) => void;
  startProject: (project: Project) => void;
  assignStaff: (staff: Staff) => void;
  triggerMinigame: (trigger: MinigameTrigger) => void;
  handlePerformDailyWork: () => void;
  handleMinigameReward: (reward: { xp: number; money: number }) => void;
}

export const useGameLogic = (): GameLogicHook => {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      era: 'analog',
      skills: [
        { type: 'recording', level: 1 },
        { type: 'mixing', level: 1 },
        { type: 'mastering', level: 1 }
      ]
    },
    ownedEquipment: [],
    projects: [],
    currentDay: 1,
    playerData: {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      money: 1000,
      reputation: 0,
      perkPoints: 0,
      attributes: {
        creativity: 1,
        technical: 1,
        business: 1,
        charisma: 1,
        creativeIntuition: 1,
        technicalAptitude: 1
      },
      dailyWorkCapacity: 100
    },
    studioSkills: {
      recording: { level: 1, xp: 0, xpToNextLevel: 100 },
      mixing: { level: 1, xp: 0, xpToNextLevel: 100 },
      mastering: { level: 1, xp: 0, xpToNextLevel: 100 }
    },
    bands: [],
    activeProject: null,
    staff: [],
    currentEra: 'analog',
    currentYear: 1970,
    selectedEra: 'analog',
    eraStartYear: 1970,
    equipmentMultiplier: 1,
    ownedUpgrades: [],
    availableProjects: [],
    availableCandidates: [],
    lastSalaryDay: 1,
    notifications: [],
    playerBands: [],
    availableSessionMusicians: [],
    activeOriginalTrack: null,
    completedProjects: [],
    studioLevel: 1,
    studioReputation: 0,
    studioSpecialization: [],
    studioChallenges: [],
    studioAchievements: [],
    events: []
  });

  const dispatch = useCallback((action: GameAction) => {
    setGameState(prevState => {
      switch (action.type) {
        case 'START_PROJECT': {
          const project = action.payload as unknown as Project;
          return {
            ...prevState,
            projects: [...prevState.projects, project]
          };
        }
        case 'ASSIGN_STAFF': {
          const staff = action.payload as Staff;
          return {
            ...prevState,
            staff: [...prevState.staff, staff]
          };
        }
        case 'TRIGGER_MINIGAME': {
          const trigger = action.payload as MinigameTrigger;
          const event: GameEvent = {
            type: 'MINIGAME_TRIGGER',
            data: { trigger },
            timestamp: Date.now()
          };
          return {
            ...prevState,
            events: [...prevState.events, event]
          };
        }
        default:
          return prevState;
      }
    });
  }, []);

  const startProject = useCallback((project: Project) => {
    dispatch({ type: 'START_PROJECT', payload: project });
  }, [dispatch]);

  const assignStaff = useCallback((staff: Staff) => {
    dispatch({ type: 'ASSIGN_STAFF', payload: staff });
  }, [dispatch]);

  const triggerMinigame = useCallback((trigger: MinigameTrigger) => {
    dispatch({ type: 'TRIGGER_MINIGAME', payload: trigger });
  }, [dispatch]);

  const handlePerformDailyWork = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      playerData: {
        ...prevState.playerData,
        money: prevState.playerData.money + 100
      }
    }));
  }, []);

  const handleMinigameReward = useCallback((reward: { xp: number; money: number }) => {
    setGameState(prevState => ({
      ...prevState,
      playerData: {
        ...prevState.playerData,
        money: prevState.playerData.money + reward.money,
        xp: prevState.playerData.xp + reward.xp
      }
    }));
  }, []);

  return {
    gameState,
    dispatch,
    startProject,
    assignStaff,
    triggerMinigame,
    handlePerformDailyWork,
    handleMinigameReward
  };
};
