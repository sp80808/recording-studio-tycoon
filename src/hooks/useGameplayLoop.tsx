
import { useCallback, useEffect, useState } from 'react';
import { GameState, Project, StaffMember } from '@/types/game';
import { toast } from '@/hooks/use-toast';

interface GameplayLoopState {
  currentPhase: 'project_selection' | 'recording' | 'mixing' | 'mastering' | 'release';
  phaseProgress: number;
  recentRewards: Array<{
    type: 'xp' | 'money' | 'reputation' | 'unlock';
    amount: number;
    message: string;
    timestamp: number;
  }>;
  streakCount: number;
  lastActionTime: number;
}

export const useGameplayLoop = (
  gameState: GameState, 
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const [loopState, setLoopState] = useState<GameplayLoopState>({
    currentPhase: 'project_selection',
    phaseProgress: 0,
    recentRewards: [],
    streakCount: 0,
    lastActionTime: Date.now()
  });

  // Core reward system - frequent micro-rewards like Kairosoft games
  const deliverMicroReward = useCallback((type: 'xp' | 'money' | 'reputation' | 'unlock', amount: number, message: string) => {
    const reward = {
      type,
      amount,
      message,
      timestamp: Date.now()
    };

    setLoopState(prev => ({
      ...prev,
      recentRewards: [...prev.recentRewards.slice(-9), reward], // Keep last 10 rewards
      streakCount: prev.streakCount + 1,
      lastActionTime: Date.now()
    }));

    // Visual feedback
    toast({
      title: "🎵 " + message,
      description: `+${amount} ${type.toUpperCase()}`,
      duration: 2000
    });

    // Apply reward to game state
    setGameState(prev => {
      const updated = { ...prev };
      switch (type) {
        case 'xp':
          updated.playerData = {
            ...prev.playerData,
            xp: prev.playerData.xp + amount
          };
          break;
        case 'money':
          updated.money = prev.money + amount;
          break;
        case 'reputation':
          updated.reputation = prev.reputation + amount;
          break;
      }
      return updated;
    });
  }, [setGameState]);

  // Project progression system
  const advanceProjectPhase = useCallback(() => {
    if (!gameState.activeProject) return;

    const project = gameState.activeProject;
    let nextPhase: GameplayLoopState['currentPhase'] = loopState.currentPhase;
    let phaseProgress = loopState.phaseProgress + 10;

    // Phase transitions with micro-rewards
    if (phaseProgress >= 100) {
      phaseProgress = 0;
      switch (loopState.currentPhase) {
        case 'project_selection':
          nextPhase = 'recording';
          deliverMicroReward('xp', 5, 'Project Started!');
          break;
        case 'recording':
          nextPhase = 'mixing';
          deliverMicroReward('xp', 10, 'Recording Complete!');
          break;
        case 'mixing':
          nextPhase = 'mastering';
          deliverMicroReward('xp', 15, 'Mix Complete!');
          break;
        case 'mastering':
          nextPhase = 'release';
          deliverMicroReward('xp', 20, 'Master Complete!');
          break;
        case 'release':
          nextPhase = 'project_selection';
          const payout = project.payoutBase + (loopState.streakCount * 50);
          deliverMicroReward('money', payout, 'Track Released!');
          deliverMicroReward('reputation', 5 + Math.floor(loopState.streakCount / 3), 'Reputation Gained!');
          
          // Complete project
          setGameState(prev => ({
            ...prev,
            activeProject: null,
            playerData: {
              ...prev.playerData,
              completedProjects: prev.playerData.completedProjects + 1
            }
          }));
          break;
      }
    }

    setLoopState(prev => ({
      ...prev,
      currentPhase: nextPhase,
      phaseProgress
    }));
  }, [gameState.activeProject, loopState, deliverMicroReward, setGameState]);

  // Staff efficiency system
  const calculateStaffEfficiency = useCallback((staff: StaffMember[]): number => {
    if (staff.length === 0) return 1;
    
    const totalSkills = staff.reduce((sum, member) => {
      return sum + (member.primaryStats.creativity + member.primaryStats.technical) / 2;
    }, 0);
    
    const avgSkill = totalSkills / staff.length;
    return Math.min(2.0, 1 + (avgSkill - 25) / 50); // 1x to 2x multiplier
  }, []);

  // Streak bonus system
  const getStreakBonus = useCallback((): number => {
    const timeSinceLastAction = Date.now() - loopState.lastActionTime;
    const hoursSinceLastAction = timeSinceLastAction / (1000 * 60 * 60);
    
    if (hoursSinceLastAction > 24) {
      // Reset streak if inactive for more than 24 hours
      setLoopState(prev => ({ ...prev, streakCount: 0 }));
      return 1;
    }
    
    return 1 + Math.min(0.5, loopState.streakCount * 0.05); // Up to 50% bonus
  }, [loopState]);

  // Auto-progression system to reduce micromanagement
  useEffect(() => {
    if (!gameState.activeProject) return;

    const staffEfficiency = calculateStaffEfficiency(gameState.hiredStaff);
    const streakBonus = getStreakBonus();
    const baseProgressTime = 3000; // 3 seconds base
    const adjustedTime = baseProgressTime / (staffEfficiency * streakBonus);

    const interval = setInterval(() => {
      advanceProjectPhase();
    }, adjustedTime);

    return () => clearInterval(interval);
  }, [gameState.activeProject, gameState.hiredStaff, advanceProjectPhase, calculateStaffEfficiency, getStreakBonus]);

  // Generate varied project types to prevent repetition
  const generateVariedProjects = useCallback((): Project[] => {
    const projectTypes = [
      { genre: 'Rock', difficulty: 2, basePayout: 500, theme: 'Power Anthem' },
      { genre: 'Pop', difficulty: 1, basePayout: 400, theme: 'Radio Hit' },
      { genre: 'Electronic', difficulty: 3, basePayout: 600, theme: 'Club Banger' },
      { genre: 'Jazz', difficulty: 4, basePayout: 700, theme: 'Smooth Sessions' },
      { genre: 'Hip-hop', difficulty: 2, basePayout: 550, theme: 'Street Beats' }
    ];

    return projectTypes.map((type, index) => ({
      id: `project-${Date.now()}-${index}`,
      title: `${type.theme} ${Math.floor(Math.random() * 100)}`,
      genre: type.genre,
      difficulty: type.difficulty,
      description: `A ${type.genre.toLowerCase()} project focusing on ${type.theme.toLowerCase()}`,
      payoutBase: type.basePayout + Math.floor(Math.random() * 200),
      creativityRequired: 20 + (type.difficulty * 5),
      technicalRequired: 15 + (type.difficulty * 5),
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      isComplete: false,
      clientName: `Client ${Math.floor(Math.random() * 100)}`,
      eraRequirement: gameState.currentEra
    }));
  }, [gameState.currentEra]);

  return {
    loopState,
    deliverMicroReward,
    advanceProjectPhase,
    calculateStaffEfficiency,
    getStreakBonus,
    generateVariedProjects
  };
};
