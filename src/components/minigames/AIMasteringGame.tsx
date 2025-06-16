import React, { useState, useEffect } from 'react';
import { AIMasteringState } from '@/types/miniGame';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Select, Input } from 'antd';
import { 
  RobotOutlined, 
  SoundOutlined, 
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface AIMasteringGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

const MASTERING_STYLES = [
  { value: 'modern', label: 'Modern Pop', icon: '🎵' },
  { value: 'warm', label: 'Warm Analog', icon: '🎚️' },
  { value: 'bright', label: 'Bright & Clear', icon: '✨' },
  { value: 'punchy', label: 'Punchy & Dynamic', icon: '💥' },
  { value: 'loud', label: 'Loud & Proud', icon: '🔊' },
  { value: 'vintage', label: 'Vintage', icon: '📻' },
];

const REFERENCE_TRACKS = [
  { value: 'pop1', label: 'Modern Pop Hit', style: 'modern' },
  { value: 'rock1', label: 'Classic Rock', style: 'warm' },
  { value: 'edm1', label: 'EDM Banger', style: 'bright' },
  { value: 'hiphop1', label: 'Hip Hop Beat', style: 'punchy' },
  { value: 'metal1', label: 'Metal Track', style: 'loud' },
  { value: 'jazz1', label: 'Jazz Standard', style: 'vintage' },
];

const PROCESSING_CHAIN = [
  { type: 'eq', label: 'EQ', parameters: ['low', 'mid', 'high'] },
  { type: 'comp', label: 'Compression', parameters: ['threshold', 'ratio', 'attack', 'release'] },
  { type: 'limit', label: 'Limiting', parameters: ['threshold', 'ceiling'] },
  { type: 'stereo', label: 'Stereo Width', parameters: ['width'] },
  { type: 'saturation', label: 'Saturation', parameters: ['amount', 'type'] },
];

export const AIMasteringGame: React.FC<AIMasteringGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<AIMasteringState>({
    isActive: true,
    currentType: 'aiMastering',
    difficulty,
    timeRemaining: 120,
    score: 0,
    progress: 0,
    style: 'modern',
    intensity: 50,
    referenceTracks: [],
    processingChain: PROCESSING_CHAIN.map(chain => ({
      type: chain.type,
      parameters: chain.parameters.reduce((acc, param) => ({
        ...acc,
        [param]: 50,
      }), {}),
    })),
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('eq');

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

  const handleStyleChange = (value: string) => {
    setState(prev => ({
      ...prev,
      style: value,
    }));
  };

  const handleIntensityChange = (value: number) => {
    setState(prev => ({
      ...prev,
      intensity: value,
    }));
  };

  const handleReferenceTrackChange = (value: string[]) => {
    setState(prev => ({
      ...prev,
      referenceTracks: value,
    }));
  };

  const handleParameterChange = (chainType: string, parameter: string, value: number) => {
    setState(prev => ({
      ...prev,
      processingChain: prev.processingChain.map(chain => {
        if (chain.type === chainType) {
          return {
            ...chain,
            parameters: {
              ...chain.parameters,
              [parameter]: value,
            },
          };
        }
        return chain;
      }),
    }));
  };

  const calculateScore = () => {
    const styleMatch = state.referenceTracks.some(track => 
      REFERENCE_TRACKS.find(ref => ref.value === track)?.style === state.style
    ) ? 20 : 0;

    const intensityScore = Math.abs(state.intensity - 50) / 50 * 20;

    const chainScore = state.processingChain.reduce((sum, chain) => {
      const paramSum = Object.values(chain.parameters).reduce((pSum, value) => pSum + value, 0);
      return sum + (paramSum / (Object.keys(chain.parameters).length * 100) * 20);
    }, 0);

    return Math.min(100, Math.floor(
      styleMatch +
      intensityScore +
      chainScore
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
      <Title level={3}>AI Mastering</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Mastering Style">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              style={{ width: '100%' }}
              value={state.style}
              onChange={handleStyleChange}
            >
              {MASTERING_STYLES.map(style => (
                <Option key={style.value} value={style.value}>
                  <Space>
                    <span>{style.icon}</span>
                    {style.label}
                  </Space>
                </Option>
              ))}
            </Select>
            <Text>Style Intensity</Text>
            <Slider
              min={0}
              max={100}
              value={state.intensity}
              onChange={handleIntensityChange}
            />
          </Space>
        </Card>

        <Card title="Reference Tracks">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select reference tracks"
            value={state.referenceTracks}
            onChange={handleReferenceTrackChange}
          >
            {REFERENCE_TRACKS.map(track => (
              <Option key={track.value} value={track.value}>
                {track.label}
              </Option>
            ))}
          </Select>
        </Card>

        <Card title="Processing Chain">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              style={{ width: '100%' }}
              value={selectedChain}
              onChange={setSelectedChain}
            >
              {PROCESSING_CHAIN.map(chain => (
                <Option key={chain.type} value={chain.type}>
                  {chain.label}
                </Option>
              ))}
            </Select>

            {state.processingChain
              .find(chain => chain.type === selectedChain)
              ?.parameters && (
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(
                    state.processingChain.find(chain => chain.type === selectedChain)!.parameters
                  ).map(([param, value]) => (
                    <div key={param}>
                      <Text>{param}</Text>
                      <Slider
                        min={0}
                        max={100}
                        value={value}
                        onChange={(value: number) => handleParameterChange(selectedChain, param, value)}
                      />
                    </div>
                  ))}
                </Space>
              </Card>
            )}
          </Space>
        </Card>

        <Space>
          <Button
            type="primary"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Pause' : 'Preview'}
          </Button>
          <Button type="primary" onClick={handleComplete}>
            Apply Mastering
          </Button>
        </Space>
      </Space>
    </div>
  );
}; 