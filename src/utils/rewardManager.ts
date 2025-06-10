import { MinigameReward, Achievement, PlayerProgress } from '@/types/game';

const REWARD_MULTIPLIERS = {
  common: 1,
  uncommon: 1.5,
  rare: 2,
  epic: 3,
  legendary: 5
};

export const calculateMinigameRewards = (
  score: number,
  difficulty: number,
  minigameType: string
): MinigameReward[] => {
  const baseReward = score * difficulty;
  const rewards: MinigameReward[] = [];

  // Experience reward (always given)
  rewards.push({
    type: 'experience',
    amount: Math.floor(baseReward * 10),
    description: 'Experience gained from minigame',
    rarity: 'common'
  });

  // Money reward (based on score)
  if (score >= 70) {
    rewards.push({
      type: 'money',
      amount: Math.floor(baseReward * 100),
      description: 'Payment for successful minigame completion',
      rarity: 'common'
    });
  }

  // Reputation reward (based on high scores)
  if (score >= 90) {
    rewards.push({
      type: 'reputation',
      amount: Math.floor(baseReward * 5),
      description: 'Reputation gained from exceptional performance',
      rarity: 'rare'
    });
  }

  // Skill reward (based on minigame type)
  const skillType = getSkillTypeForMinigame(minigameType);
  if (skillType) {
    rewards.push({
      type: 'skill',
      amount: Math.floor(baseReward * 2),
      description: `${skillType} skill improvement`,
      rarity: 'uncommon'
    });
  }

  // Special equipment reward (rare chance)
  if (score >= 95 && Math.random() < 0.1) {
    rewards.push({
      type: 'equipment',
      amount: 1,
      description: 'Special equipment unlocked',
      rarity: 'epic'
    });
  }

  return rewards;
};

const getSkillTypeForMinigame = (minigameType: string): string | null => {
  const skillMap: Record<string, string> = {
    'rhythm': 'technical',
    'mixing': 'technical',
    'waveform': 'creative',
    'beatmaking': 'creative',
    'vocal': 'technical',
    'mastering': 'technical',
    'effectchain': 'creative',
    'acoustic': 'technical',
    'layering': 'creative',
    'tape_splicing': 'technical',
    'four_track_recording': 'technical',
    'midi_programming': 'technical',
    'digital_mixing': 'technical',
    'sample_editing': 'creative',
    'sound_design': 'creative',
    'audio_restoration': 'technical'
  };

  return skillMap[minigameType] || null;
};

export const applyRewards = (
  rewards: MinigameReward[],
  progress: PlayerProgress
): PlayerProgress => {
  const newProgress = { ...progress };
  let repAmount: number;
  let skillType: string;

  rewards.forEach(reward => {
    const multiplier = REWARD_MULTIPLIERS[reward.rarity];

    switch (reward.type) {
      case 'experience':
        newProgress.experience += reward.amount * multiplier;
        // Level up check
        while (newProgress.experience >= getRequiredExperience(newProgress.level)) {
          newProgress.level++;
        }
        break;

      case 'money':
        // Handle money in game state
        break;

      case 'reputation':
        // Distribute reputation across levels
        repAmount = reward.amount * multiplier;
        newProgress.reputation.local += repAmount * 0.4;
        newProgress.reputation.regional += repAmount * 0.3;
        newProgress.reputation.national += repAmount * 0.2;
        newProgress.reputation.global += repAmount * 0.1;
        break;

      case 'skill':
        // Apply skill improvement
        skillType = reward.description.split(' ')[0].toLowerCase();
        if (skillType in newProgress.skills) {
          newProgress.skills[skillType as keyof typeof newProgress.skills] += 
            reward.amount * multiplier;
        }
        break;

      case 'equipment':
        // Handle equipment unlock
        newProgress.unlockedFeatures.push(`equipment_${Date.now()}`);
        break;
    }
  });

  return newProgress;
};

const getRequiredExperience = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const checkAchievements = (
  progress: PlayerProgress,
  minigameType: string,
  score: number
): Achievement[] => {
  const newAchievements: Achievement[] = [];

  // Check for minigame-specific achievements
  if (score >= 100) {
    newAchievements.push({
      id: `perfect_${minigameType}`,
      title: `Perfect ${minigameType.replace(/_/g, ' ')}`,
      description: `Achieve a perfect score in ${minigameType.replace(/_/g, ' ')}`,
      type: 'production',
      requirements: [
        { type: 'score', value: 100 }
      ],
      rewards: [{
        type: 'experience',
        amount: 1000,
        description: 'Perfect score bonus',
        rarity: 'legendary'
      }],
      unlocked: true,
      progress: 100
    });
  }

  // Check for skill-based achievements
  Object.entries(progress.skills).forEach(([skill, level]) => {
    if (level >= 50 && !progress.achievements.some(a => a.id === `master_${skill}`)) {
      newAchievements.push({
        id: `master_${skill}`,
        title: `${skill} Master`,
        description: `Reach level 50 in ${skill}`,
        type: 'production',
        requirements: [
          { type: skill, value: 50 }
        ],
        rewards: [{
          type: 'skill',
          amount: 100,
          description: `${skill} mastery bonus`,
          rarity: 'epic'
        }],
        unlocked: true,
        progress: 100
      });
    }
  });

  return newAchievements;
}; 