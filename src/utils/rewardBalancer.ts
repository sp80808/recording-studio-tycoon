import { MiniGame, MiniGameDifficulty } from '@/types/miniGame';
import { PlayerAttributes } from '@/types/game';

interface RewardMultiplier {
  difficulty: MiniGameDifficulty;
  baseXP: number;
  attributeMultiplier: number;
  reputationMultiplier: number;
}

const DIFFICULTY_MULTIPLIERS: Record<MiniGameDifficulty, RewardMultiplier> = {
  beginner: {
    difficulty: 'beginner',
    baseXP: 100,
    attributeMultiplier: 1,
    reputationMultiplier: 1,
  },
  intermediate: {
    difficulty: 'intermediate',
    baseXP: 200,
    attributeMultiplier: 1.5,
    reputationMultiplier: 1.5,
  },
  advanced: {
    difficulty: 'advanced',
    baseXP: 300,
    attributeMultiplier: 2,
    reputationMultiplier: 2,
  },
};

interface ScoreMultiplier {
  threshold: number;
  multiplier: number;
}

const SCORE_MULTIPLIERS: ScoreMultiplier[] = [
  { threshold: 90, multiplier: 1.5 },
  { threshold: 80, multiplier: 1.3 },
  { threshold: 70, multiplier: 1.1 },
  { threshold: 60, multiplier: 1.0 },
  { threshold: 0, multiplier: 0.8 },
];

export const calculateRewards = (
  game: MiniGame,
  score: number,
  playerLevel: number,
  consecutiveWins: number
): {
  xp: number;
  attributes: Partial<PlayerAttributes>;
  reputation: number;
} => {
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[game.difficulty];
  const scoreMultiplier = SCORE_MULTIPLIERS.find(m => score >= m.threshold)?.multiplier || 0.8;
  const levelMultiplier = 1 + (playerLevel * 0.05); // 5% increase per level
  const streakMultiplier = 1 + (consecutiveWins * 0.1); // 10% increase per consecutive win

  // Calculate base XP
  const baseXP = difficultyMultiplier.baseXP;
  const finalXP = Math.round(
    baseXP * scoreMultiplier * levelMultiplier * streakMultiplier
  );

  // Calculate attribute gains
  const attributeGains: Partial<PlayerAttributes> = {};
  Object.entries(game.rewards.attributes).forEach(([key, value]) => {
    attributeGains[key as keyof PlayerAttributes] = Math.round(
      value * difficultyMultiplier.attributeMultiplier * scoreMultiplier
    );
  });

  // Calculate reputation gain
  const baseReputation = game.rewards.reputation || 0;
  const finalReputation = Math.round(
    baseReputation * difficultyMultiplier.reputationMultiplier * scoreMultiplier
  );

  return {
    xp: finalXP,
    attributes: attributeGains,
    reputation: finalReputation,
  };
};

export const getOptimalRewards = (
  game: MiniGame,
  playerLevel: number
): {
  minScore: number;
  maxScore: number;
  minXP: number;
  maxXP: number;
} => {
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[game.difficulty];
  const levelMultiplier = 1 + (playerLevel * 0.05);

  const minScore = 60;
  const maxScore = 100;

  const minXP = Math.round(
    difficultyMultiplier.baseXP * 0.8 * levelMultiplier
  );
  const maxXP = Math.round(
    difficultyMultiplier.baseXP * 1.5 * levelMultiplier * 1.5 // Including streak multiplier
  );

  return {
    minScore,
    maxScore,
    minXP,
    maxXP,
  };
};

export const getDifficultyProgression = (
  playerLevel: number,
  gamesPlayed: number
): MiniGameDifficulty => {
  if (playerLevel >= 30 || gamesPlayed >= 50) return 'advanced';
  if (playerLevel >= 15 || gamesPlayed >= 25) return 'intermediate';
  return 'beginner';
};

export const getCooldownTime = (
  game: MiniGame,
  playerLevel: number,
  recentGames: number
): number => {
  const baseCooldown = game.cooldown;
  const levelReduction = Math.min(playerLevel * 0.5, 30); // Up to 30 minutes reduction
  const recentGamesPenalty = Math.min(recentGames * 5, 20); // Up to 20 minutes penalty

  return Math.max(baseCooldown - levelReduction + recentGamesPenalty, 15); // Minimum 15 minutes
}; 