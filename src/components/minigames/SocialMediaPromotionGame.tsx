import React, { useState, useEffect } from 'react';
import { SocialMediaPromotionState } from '@/types/miniGame';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Input, Select } from 'antd';
import { 
  InstagramOutlined, 
  TwitterOutlined, 
  YoutubeOutlined, 
  FacebookOutlined,
  TikTokOutlined,
  DollarOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SocialMediaPromotionGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

const PLATFORMS = {
  instagram: { name: 'Instagram', icon: <InstagramOutlined />, color: '#E1306C' },
  twitter: { name: 'Twitter', icon: <TwitterOutlined />, color: '#1DA1F2' },
  youtube: { name: 'YouTube', icon: <YoutubeOutlined />, color: '#FF0000' },
  facebook: { name: 'Facebook', icon: <FacebookOutlined />, color: '#4267B2' },
  tiktok: { name: 'TikTok', icon: <TikTokOutlined />, color: '#000000' },
};

const CONTENT_TYPES = [
  { value: 'teaser', label: 'Release Teaser', icon: '🎬' },
  { value: 'behind', label: 'Behind the Scenes', icon: '🎥' },
  { value: 'live', label: 'Live Performance', icon: '🎤' },
  { value: 'interview', label: 'Artist Interview', icon: '🎙️' },
  { value: 'studio', label: 'Studio Session', icon: '🎹' },
];

export const SocialMediaPromotionGame: React.FC<SocialMediaPromotionGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<SocialMediaPromotionState>({
    isActive: true,
    currentType: 'socialMediaPromotion',
    difficulty,
    timeRemaining: 120,
    score: 0,
    progress: 0,
    platforms: Object.keys(PLATFORMS).reduce((acc, key) => ({
      ...acc,
      [key]: {
        followers: 0,
        engagement: 0,
        contentQuality: 0,
      },
    }), {}),
    campaignBudget: 2000,
    targetMetrics: {
      reach: 0,
      engagement: 0,
      conversion: 0,
    },
  });

  const [selectedContent, setSelectedContent] = useState<string>('');
  const [contentText, setContentText] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

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

  const handlePlatformChange = (platform: string, field: 'followers' | 'engagement' | 'contentQuality', value: number) => {
    setState(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          [field]: value,
        },
      },
    }));
  };

  const handleBudgetChange = (value: number) => {
    setState(prev => ({
      ...prev,
      campaignBudget: value,
    }));
  };

  const handleMetricsChange = (metric: keyof typeof state.targetMetrics, value: number) => {
    setState(prev => ({
      ...prev,
      targetMetrics: {
        ...prev.targetMetrics,
        [metric]: value,
      },
    }));
  };

  const calculateScore = () => {
    const platformScore = Object.entries(state.platforms)
      .filter(([key]) => selectedPlatforms.includes(key))
      .reduce((sum, [_, data]) => {
        return sum + (
          (data.followers * 0.3) +
          (data.engagement * 0.4) +
          (data.contentQuality * 0.3)
        );
      }, 0);

    const contentScore = selectedContent && contentText.length > 50 ? 20 : 0;
    const budgetEfficiency = state.campaignBudget / 2000;
    const metricsScore = Object.values(state.targetMetrics).reduce((sum, value) => sum + value, 0) / 3;

    return Math.min(100, Math.floor(
      (platformScore * 0.4) +
      (contentScore * 0.2) +
      (budgetEfficiency * 20) +
      (metricsScore * 0.2)
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
      <Title level={3}>Social Media Promotion</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Platform Selection">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select platforms"
            onChange={setSelectedPlatforms}
          >
            {Object.entries(PLATFORMS).map(([key, { name, icon }]) => (
              <Option key={key} value={key}>
                <Space>
                  {icon}
                  {name}
                </Space>
              </Option>
            ))}
          </Select>

          {selectedPlatforms.map(platform => (
            <Card key={platform} size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Followers</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.platforms[platform].followers}
                  onChange={(value: number) => handlePlatformChange(platform, 'followers', value)}
                />
                <Text>Engagement</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.platforms[platform].engagement}
                  onChange={(value: number) => handlePlatformChange(platform, 'engagement', value)}
                />
                <Text>Content Quality</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.platforms[platform].contentQuality}
                  onChange={(value: number) => handlePlatformChange(platform, 'contentQuality', value)}
                />
              </Space>
            </Card>
          ))}
        </Card>

        <Card title="Content Creation">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select content type"
              onChange={setSelectedContent}
            >
              {CONTENT_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  <Space>
                    <span>{type.icon}</span>
                    {type.label}
                  </Space>
                </Option>
              ))}
            </Select>
            <TextArea
              rows={4}
              placeholder="Write your content..."
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
            />
          </Space>
        </Card>

        <Card title="Campaign Budget">
          <Space>
            <DollarOutlined />
            <Slider
              min={0}
              max={5000}
              value={state.campaignBudget}
              onChange={handleBudgetChange}
            />
          </Space>
        </Card>

        <Card title="Target Metrics">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Reach</Text>
            <Slider
              min={0}
              max={100}
              value={state.targetMetrics.reach}
              onChange={(value: number) => handleMetricsChange('reach', value)}
            />
            <Text>Engagement</Text>
            <Slider
              min={0}
              max={100}
              value={state.targetMetrics.engagement}
              onChange={(value: number) => handleMetricsChange('engagement', value)}
            />
            <Text>Conversion</Text>
            <Slider
              min={0}
              max={100}
              value={state.targetMetrics.conversion}
              onChange={(value: number) => handleMetricsChange('conversion', value)}
            />
          </Space>
        </Card>

        <Button type="primary" onClick={handleComplete}>
          Launch Campaign
        </Button>
      </Space>
    </div>
  );
}; 