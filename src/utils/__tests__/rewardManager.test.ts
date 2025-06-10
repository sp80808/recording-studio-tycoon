import { calculateMinigameRewards, applyRewards, checkAchievements } from '../rewardManager';
import { PlayerProgress, MinigameReward, Achievement } from '@/types/game';

describe('rewardManager', () => {
  const mockInitialProgress: PlayerProgress = {
    level: 1,
    experience: 0,
    skills: {
      technical: 0,
      creative: 0,
      business: 0
    },
    achievements: [],
    unlockedFeatures: [],
    reputation: {
      local: 0,
      regional: 0,
      national: 0,
      global: 0
    }
  };

  describe('calculateMinigameRewards', () => {
    it('should calculate rewards based on score and difficulty', () => {
      const rewards = calculateMinigameRewards(85, 2, 'mixing');
      
      expect(rewards).toHaveLength(4); // Experience, Money, Reputation, Skill
      expect(rewards[0].type).toBe('experience');
      expect(rewards[1].type).toBe('money');
      expect(rewards[2].type).toBe('reputation');
      expect(rewards[3].type).toBe('skill');
    });

    it('should not give money reward for low scores', () => {
      const rewards = calculateMinigameRewards(60, 2, 'mixing');
      
      expect(rewards.find(r => r.type === 'money')).toBeUndefined();
    });

    it('should not give reputation reward for low scores', () => {
      const rewards = calculateMinigameRewards(80, 2, 'mixing');
      
      expect(rewards.find(r => r.type === 'reputation')).toBeUndefined();
    });

    it('should give appropriate skill type based on minigame', () => {
      const technicalRewards = calculateMinigameRewards(85, 2, 'mixing');
      const creativeRewards = calculateMinigameRewards(85, 2, 'sound_design');
      
      expect(technicalRewards.find(r => r.type === 'skill')?.description).toContain('technical');
      expect(creativeRewards.find(r => r.type === 'skill')?.description).toContain('creative');
    });
  });

  describe('applyRewards', () => {
    it('should apply experience rewards correctly', () => {
      const rewards: MinigameReward[] = [{
        type: 'experience',
        amount: 100,
        description: 'Test experience',
        rarity: 'common'
      }];

      const newProgress = applyRewards(rewards, mockInitialProgress);
      
      expect(newProgress.experience).toBe(100);
    });

    it('should apply reputation rewards with correct distribution', () => {
      const rewards: MinigameReward[] = [{
        type: 'reputation',
        amount: 100,
        description: 'Test reputation',
        rarity: 'common'
      }];

      const newProgress = applyRewards(rewards, mockInitialProgress);
      
      expect(newProgress.reputation.local).toBe(40);
      expect(newProgress.reputation.regional).toBe(30);
      expect(newProgress.reputation.national).toBe(20);
      expect(newProgress.reputation.global).toBe(10);
    });

    it('should apply skill rewards correctly', () => {
      const rewards: MinigameReward[] = [{
        type: 'skill',
        amount: 50,
        description: 'technical skill improvement',
        rarity: 'common'
      }];

      const newProgress = applyRewards(rewards, mockInitialProgress);
      
      expect(newProgress.skills.technical).toBe(50);
    });

    it('should apply rarity multipliers correctly', () => {
      const rewards: MinigameReward[] = [{
        type: 'experience',
        amount: 100,
        description: 'Test experience',
        rarity: 'epic'
      }];

      const newProgress = applyRewards(rewards, mockInitialProgress);
      
      expect(newProgress.experience).toBe(300); // 100 * 3 (epic multiplier)
    });
  });

  describe('checkAchievements', () => {
    it('should award perfect score achievement', () => {
      const achievements = checkAchievements(mockInitialProgress, 'mixing', 100);
      
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe('perfect_mixing');
      expect(achievements[0].unlocked).toBe(true);
    });

    it('should not award perfect score achievement for non-perfect scores', () => {
      const achievements = checkAchievements(mockInitialProgress, 'mixing', 99);
      
      expect(achievements).toHaveLength(0);
    });

    it('should award skill mastery achievement', () => {
      const progressWithHighSkill = {
        ...mockInitialProgress,
        skills: {
          ...mockInitialProgress.skills,
          technical: 50
        }
      };

      const achievements = checkAchievements(progressWithHighSkill, 'mixing', 85);
      
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe('master_technical');
      expect(achievements[0].unlocked).toBe(true);
    });

    it('should not award duplicate achievements', () => {
      const progressWithAchievement: PlayerProgress = {
        ...mockInitialProgress,
        achievements: [{
          id: 'master_technical',
          title: 'Technical Master',
          description: 'Reach level 50 in technical',
          type: 'production',
          requirements: [{ type: 'technical', value: 50 }],
          rewards: [],
          unlocked: true,
          progress: 100
        }],
        skills: {
          ...mockInitialProgress.skills,
          technical: 50
        }
      };

      const achievements = checkAchievements(progressWithAchievement, 'mixing', 85);
      
      expect(achievements).toHaveLength(0);
    });
  });
}); 