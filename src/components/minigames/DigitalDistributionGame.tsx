import React, { useState, useEffect } from 'react';
import { DigitalDistributionState } from '@/types/miniGame';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Alert } from 'antd';
import { SoundOutlined, GlobalOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface DigitalDistributionGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

const PLATFORMS = {
  spotify: { name: 'Spotify', icon: '🎵' },
  appleMusic: { name: 'Apple Music', icon: '🍎' },
  youtube: { name: 'YouTube Music', icon: '▶️' },
  amazon: { name: 'Amazon Music', icon: '📦' },
  tidal: { name: 'Tidal', icon: '🌊' },
  deezer: { name: 'Deezer', icon: '🎧' },
};

const TARGET_AUDIENCES = {
  pop: { name: 'Pop', icon: '🎤' },
  rock: { name: 'Rock', icon: '🎸' },
  electronic: { name: 'Electronic', icon: '🎹' },
  hiphop: { name: 'Hip Hop', icon: '🎧' },
  jazz: { name: 'Jazz', icon: '🎷' },
  classical: { name: 'Classical', icon: '🎻' },
};

export const DigitalDistributionGame: React.FC<DigitalDistributionGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<DigitalDistributionState>({
    isActive: true,
    currentType: 'digitalDistribution',
    difficulty,
    timeRemaining: 60,
    score: 0,
    progress: 0,
    platforms: Object.keys(PLATFORMS).reduce((acc, key) => ({
      ...acc,
      [key]: {
        selected: false,
        optimization: 0,
        reach: 0,
      },
    }), {}),
    marketingBudget: 1000,
    targetAudience: Object.keys(TARGET_AUDIENCES).reduce((acc, key) => ({
      ...acc,
      [key]: 0,
    }), {}),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 0) {
          clearInterval(timer);
          handleComplete();
          return prev;
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePlatformToggle = (platform: string) => {
    setState(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          selected: !prev.platforms[platform].selected,
        },
      },
    }));
  };

  const handleOptimizationChange = (platform: string, value: number) => {
    setState(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          optimization: value,
        },
      },
    }));
  };

  const handleBudgetChange = (value: number) => {
    setState(prev => ({
      ...prev,
      marketingBudget: value,
    }));
  };

  const handleAudienceChange = (audience: string, value: number) => {
    setState(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        [audience]: value,
      },
    }));
  };

  const calculateScore = () => {
    const selectedPlatforms = Object.entries(state.platforms)
      .filter(([_, data]) => data.selected)
      .length;

    const totalOptimization = Object.values(state.platforms)
      .reduce((sum, platform) => sum + (platform.selected ? platform.optimization : 0), 0);

    const audienceFocus = Object.values(state.targetAudience)
      .reduce((sum, value) => sum + value, 0);

    const budgetEfficiency = state.marketingBudget / 1000;

    return Math.min(100, Math.floor(
      (selectedPlatforms * 10) +
      (totalOptimization * 0.5) +
      (audienceFocus * 0.3) +
      (budgetEfficiency * 20)
    ));
  };

  const handleComplete = () => {
    const score = calculateScore();
    onComplete({
      success: score >= 60,
      score,
    });
  };

  return (
    <div className="minigame-container">
      <Title level={3}>Digital Distribution Optimization</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Platform Selection">
          <Space wrap>
            {Object.entries(PLATFORMS).map(([key, { name, icon }]) => (
              <Card
                key={key}
                size="small"
                style={{
                  width: 200,
                  border: state.platforms[key].selected ? '2px solid #1890ff' : undefined,
                }}
                onClick={() => handlePlatformToggle(key)}
              >
                <Space>
                  <span>{icon}</span>
                  <Text>{name}</Text>
                </Space>
                {state.platforms[key].selected && (
                  <Slider
                    min={0}
                    max={100}
                    value={state.platforms[key].optimization}
                    onChange={(value: number) => handleOptimizationChange(key, value)}
                    tooltip={{ formatter: (value?: number) => `${value}%` }}
                  />
                )}
              </Card>
            ))}
          </Space>
        </Card>

        <Card title="Marketing Budget">
          <Space>
            <DollarOutlined />
            <Slider
              min={0}
              max={5000}
              value={state.marketingBudget}
              onChange={(value: number) => handleBudgetChange(value)}
              tooltip={{ formatter: (value?: number) => `$${value}` }}
            />
          </Space>
        </Card>

        <Card title="Target Audience">
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.entries(TARGET_AUDIENCES).map(([key, { name, icon }]) => (
              <Space key={key}>
                <span>{icon}</span>
                <Text>{name}</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.targetAudience[key]}
                  onChange={(value: number) => handleAudienceChange(key, value)}
                  tooltip={{ formatter: (value?: number) => `${value}%` }}
                />
              </Space>
            ))}
          </Space>
        </Card>

        <Button type="primary" onClick={handleComplete}>
          Complete Distribution
        </Button>
      </Space>
    </div>
  );
};
