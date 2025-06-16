import React, { useState, useEffect } from 'react';
import { StreamingOptimizationState } from '@/types/miniGame';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Input, Select, Tag } from 'antd';
import { 
  SpotifyOutlined, 
  AppleOutlined, 
  YoutubeOutlined, 
  SoundOutlined,
  TagsOutlined,
  GlobalOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface StreamingOptimizationGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

const PLATFORMS = {
  spotify: { name: 'Spotify', icon: <SpotifyOutlined />, color: '#1DB954' },
  apple: { name: 'Apple Music', icon: <AppleOutlined />, color: '#FB2D3F' },
  youtube: { name: 'YouTube Music', icon: <YoutubeOutlined />, color: '#FF0000' },
  tidal: { name: 'Tidal', icon: <SoundOutlined />, color: '#000000' },
};

const GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
  'R&B', 'Country', 'Folk', 'Metal', 'Punk', 'Blues',
  'Reggae', 'Soul', 'Funk', 'Disco', 'Gospel', 'World'
];

const MOODS = [
  'Energetic', 'Relaxed', 'Happy', 'Sad', 'Angry', 'Romantic',
  'Nostalgic', 'Mysterious', 'Dreamy', 'Aggressive', 'Peaceful',
  'Melancholic', 'Uplifting', 'Dark', 'Bright', 'Intense'
];

export const StreamingOptimizationGame: React.FC<StreamingOptimizationGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<StreamingOptimizationState>({
    isActive: true,
    currentType: 'streamingOptimization',
    difficulty,
    timeRemaining: 90,
    score: 0,
    progress: 0,
    platforms: Object.keys(PLATFORMS).reduce((acc, key) => ({
      ...acc,
      [key]: {
        optimization: 0,
        reach: 0,
        conversion: 0,
      },
    }), {}),
    metadata: {
      title: '',
      artist: '',
      genre: [],
      mood: [],
      tags: [],
    },
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

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

  const handlePlatformChange = (platform: string, field: 'optimization' | 'reach' | 'conversion', value: number) => {
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

  const handleMetadataChange = (field: keyof typeof state.metadata, value: string | string[]) => {
    setState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handleAddTag = () => {
    if (customTag && !state.metadata.tags.includes(customTag)) {
      setState(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          tags: [...prev.metadata.tags, customTag],
        },
      }));
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags.filter(t => t !== tag),
      },
    }));
  };

  const calculateScore = () => {
    const platformScore = Object.entries(state.platforms)
      .filter(([key]) => selectedPlatforms.includes(key))
      .reduce((sum, [_, data]) => {
        return sum + (
          (data.optimization * 0.4) +
          (data.reach * 0.3) +
          (data.conversion * 0.3)
        );
      }, 0);

    const metadataScore = (
      (state.metadata.title.length > 0 ? 10 : 0) +
      (state.metadata.artist.length > 0 ? 10 : 0) +
      (state.metadata.genre.length * 5) +
      (state.metadata.mood.length * 5) +
      (state.metadata.tags.length * 2)
    );

    return Math.min(100, Math.floor(
      (platformScore * 0.6) +
      (metadataScore * 0.4)
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
      <Title level={3}>Streaming Optimization</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Platform Optimization">
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
                <Text>Optimization</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.platforms[platform].optimization}
                  onChange={(value: number) => handlePlatformChange(platform, 'optimization', value)}
                />
                <Text>Reach</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.platforms[platform].reach}
                  onChange={(value: number) => handlePlatformChange(platform, 'reach', value)}
                />
                <Text>Conversion</Text>
                <Slider
                  min={0}
                  max={100}
                  value={state.platforms[platform].conversion}
                  onChange={(value: number) => handlePlatformChange(platform, 'conversion', value)}
                />
              </Space>
            </Card>
          ))}
        </Card>

        <Card title="Metadata">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Track Title"
              value={state.metadata.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
            />
            <Input
              placeholder="Artist Name"
              value={state.metadata.artist}
              onChange={(e) => handleMetadataChange('artist', e.target.value)}
            />
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select genres"
              onChange={(value) => handleMetadataChange('genre', value)}
            >
              {GENRES.map(genre => (
                <Option key={genre} value={genre}>{genre}</Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select moods"
              onChange={(value) => handleMetadataChange('mood', value)}
            >
              {MOODS.map(mood => (
                <Option key={mood} value={mood}>{mood}</Option>
              ))}
            </Select>
            <Space>
              <Input
                placeholder="Add custom tag"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onPressEnter={handleAddTag}
              />
              <Button onClick={handleAddTag}>Add</Button>
            </Space>
            <div style={{ marginTop: 8 }}>
              {state.metadata.tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  style={{ marginBottom: 8 }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Space>
        </Card>

        <Button type="primary" onClick={handleComplete}>
          Optimize Release
        </Button>
      </Space>
    </div>
  );
}; 