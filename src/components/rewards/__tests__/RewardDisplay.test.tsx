import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardDisplay } from '../RewardDisplay';
import { MinigameReward, Achievement } from '@/types/game';

describe('RewardDisplay', () => {
  const mockRewards: MinigameReward[] = [
    {
      type: 'experience',
      amount: 100,
      description: 'Experience gained',
      rarity: 'common'
    },
    {
      type: 'skill',
      amount: 50,
      description: 'technical skill improvement',
      rarity: 'epic'
    }
  ];

  const mockAchievements: Achievement[] = [
    {
      id: 'perfect_mixing',
      title: 'Perfect Mixing',
      description: 'Achieve a perfect score in mixing',
      type: 'production',
      requirements: [{ type: 'score', value: 100 }],
      rewards: [],
      unlocked: true,
      progress: 100
    }
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render rewards and achievements', () => {
    render(
      <RewardDisplay
        rewards={mockRewards}
        achievements={mockAchievements}
        onClose={mockOnClose}
      />
    );

    // Check rewards
    expect(screen.getByText('Experience gained')).toBeInTheDocument();
    expect(screen.getByText('technical skill improvement')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    // Check achievements
    expect(screen.getByText('Perfect Mixing')).toBeInTheDocument();
    expect(screen.getByText('Achieve a perfect score in mixing')).toBeInTheDocument();
  });

  it('should handle empty rewards and achievements', () => {
    render(
      <RewardDisplay
        rewards={[]}
        achievements={[]}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Rewards Earned')).not.toBeInTheDocument();
    expect(screen.queryByText('Achievements Unlocked')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <RewardDisplay
        rewards={mockRewards}
        achievements={mockAchievements}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when continue button is clicked', () => {
    render(
      <RewardDisplay
        rewards={mockRewards}
        achievements={mockAchievements}
        onClose={mockOnClose}
      />
    );

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display correct rarity colors and icons', () => {
    render(
      <RewardDisplay
        rewards={mockRewards}
        achievements={mockAchievements}
        onClose={mockOnClose}
      />
    );

    // Check common rarity
    const commonReward = screen.getByText('Experience gained').closest('div');
    expect(commonReward).toHaveClass('bg-gray-100');
    expect(screen.getByText('⭐')).toBeInTheDocument();

    // Check epic rarity
    const epicReward = screen.getByText('technical skill improvement').closest('div');
    expect(epicReward).toHaveClass('bg-purple-100');
    expect(screen.getByText('⭐⭐⭐⭐')).toBeInTheDocument();
  });

  it('should display achievement with trophy icon', () => {
    render(
      <RewardDisplay
        rewards={mockRewards}
        achievements={mockAchievements}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('🏆')).toBeInTheDocument();
  });
}); 