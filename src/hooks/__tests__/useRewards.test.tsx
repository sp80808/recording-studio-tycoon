import { renderHook, act } from '@testing-library/react';
import { useRewards } from '../useRewards';
import { PlayerProgress } from '@/types/game';

describe('useRewards', () => {
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

  it('should initialize with provided progress', () => {
    const { result } = renderHook(() => useRewards(mockInitialProgress));

    expect(result.current.playerProgress).toEqual(mockInitialProgress);
    expect(result.current.recentRewards).toEqual([]);
    expect(result.current.recentAchievements).toEqual([]);
  });

  it('should process minigame completion and update progress', () => {
    const { result } = renderHook(() => useRewards(mockInitialProgress));

    act(() => {
      result.current.processMinigameCompletion(85, 2, 'mixing');
    });

    // Should have rewards
    expect(result.current.recentRewards.length).toBeGreaterThan(0);
    
    // Progress should be updated
    expect(result.current.playerProgress.experience).toBeGreaterThan(0);
    expect(result.current.playerProgress.skills.technical).toBeGreaterThan(0);
  });

  it('should award achievements for perfect scores', () => {
    const { result } = renderHook(() => useRewards(mockInitialProgress));

    act(() => {
      result.current.processMinigameCompletion(100, 2, 'mixing');
    });

    // Should have achievements
    expect(result.current.recentAchievements.length).toBeGreaterThan(0);
    expect(result.current.recentAchievements[0].id).toBe('perfect_mixing');
  });

  it('should reset recent rewards and achievements', () => {
    const { result } = renderHook(() => useRewards(mockInitialProgress));

    act(() => {
      result.current.processMinigameCompletion(85, 2, 'mixing');
    });

    // Should have rewards and achievements
    expect(result.current.recentRewards.length).toBeGreaterThan(0);

    act(() => {
      result.current.resetRecentRewards();
    });

    // Should be reset
    expect(result.current.recentRewards).toEqual([]);
    expect(result.current.recentAchievements).toEqual([]);
  });

  it('should accumulate progress across multiple completions', () => {
    const { result } = renderHook(() => useRewards(mockInitialProgress));

    act(() => {
      result.current.processMinigameCompletion(85, 2, 'mixing');
    });

    const firstProgress = { ...result.current.playerProgress };

    act(() => {
      result.current.processMinigameCompletion(85, 2, 'mixing');
    });

    // Progress should be higher after second completion
    expect(result.current.playerProgress.experience).toBeGreaterThan(firstProgress.experience);
    expect(result.current.playerProgress.skills.technical).toBeGreaterThan(firstProgress.skills.technical);
  });

  it('should handle different minigame types correctly', () => {
    const { result } = renderHook(() => useRewards(mockInitialProgress));

    act(() => {
      result.current.processMinigameCompletion(85, 2, 'sound_design');
    });

    // Should improve creative skill for sound design
    expect(result.current.playerProgress.skills.creative).toBeGreaterThan(0);
    expect(result.current.playerProgress.skills.technical).toBe(0);
  });
}); 