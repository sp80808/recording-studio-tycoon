import React, { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Switch, Select } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  SoundOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface MasteringChainGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

interface Processor {
  id: string;
  name: string;
  type: 'eq' | 'compressor' | 'limiter' | 'saturator' | 'stereo';
  enabled: boolean;
  parameters: Record<string, number>;
}

interface GameState {
  isActive: boolean;
  currentType: string;
  difficulty: number;
  timeRemaining: number;
  score: number;
  progress: number;
  isPlaying: boolean;
  currentProcessor: string;
  processors: Processor[];
  selectedPreset: string;
}

const PROCESSORS: Processor[] = [
  {
    id: 'eq1',
    name: 'Mastering EQ',
    type: 'eq',
    enabled: true,
    parameters: {
      lowShelf: 50,
      lowMid: 50,
      highMid: 50,
      highShelf: 50,
    },
  },
  {
    id: 'comp1',
    name: 'Mastering Compressor',
    type: 'compressor',
    enabled: true,
    parameters: {
      threshold: 50,
      ratio: 50,
      attack: 50,
      release: 50,
      makeup: 50,
    },
  },
  {
    id: 'sat1',
    name: 'Analog Saturator',
    type: 'saturator',
    enabled: true,
    parameters: {
      drive: 50,
      tone: 50,
      mix: 50,
    },
  },
  {
    id: 'stereo1',
    name: 'Stereo Imager',
    type: 'stereo',
    enabled: true,
    parameters: {
      width: 50,
      balance: 50,
    },
  },
  {
    id: 'lim1',
    name: 'Final Limiter',
    type: 'limiter',
    enabled: true,
    parameters: {
      threshold: 50,
      release: 50,
      ceiling: 50,
    },
  },
];

const PRESETS = [
  { value: 'loud', label: 'Loud & Proud' },
  { value: 'warm', label: 'Warm & Analog' },
  { value: 'transparent', label: 'Transparent' },
  { value: 'vintage', label: 'Vintage Style' },
  { value: 'modern', label: 'Modern Master' },
];

export const MasteringChainGame: React.FC<MasteringChainGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<GameState>({
    isActive: true,
    currentType: 'masteringChain',
    difficulty,
    timeRemaining: 180,
    score: 0,
    progress: 0,
    isPlaying: false,
    currentProcessor: PROCESSORS[0].id,
    processors: PROCESSORS,
    selectedPreset: 'modern',
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

  const handleProcessorChange = (processorId: string) => {
    setState(prev => ({
      ...prev,
      currentProcessor: processorId,
    }));
  };

  const handleParameterChange = (processorId: string, param: string, value: number) => {
    setState(prev => ({
      ...prev,
      processors: prev.processors.map(processor => {
        if (processor.id === processorId) {
          return {
            ...processor,
            parameters: {
              ...processor.parameters,
              [param]: value,
            },
          };
        }
        return processor;
      }),
    }));
  };

  const handleProcessorToggle = (processorId: string, enabled: boolean) => {
    setState(prev => ({
      ...prev,
      processors: prev.processors.map(processor => {
        if (processor.id === processorId) {
          return {
            ...processor,
            enabled,
          };
        }
        return processor;
      }),
    }));
  };

  const handlePresetChange = (preset: string) => {
    setState(prev => ({
      ...prev,
      selectedPreset: preset,
    }));
  };

  const calculateScore = () => {
    const processorScores = state.processors.map(processor => {
      if (!processor.enabled) return 0;

      let score = 0;
      switch (processor.type) {
        case 'eq':
          score = Object.values(processor.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 25 : 0), 0);
          break;
        case 'compressor':
          score = Object.values(processor.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 20 : 0), 0);
          break;
        case 'saturator':
          score = Object.values(processor.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 33 : 0), 0);
          break;
        case 'stereo':
          score = Object.values(processor.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 50 : 0), 0);
          break;
        case 'limiter':
          score = Object.values(processor.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 33 : 0), 0);
          break;
      }
      return score;
    });

    return Math.min(100, Math.floor(
      processorScores.reduce((sum, score) => sum + score, 0) / state.processors.length
    ));
  };

  const handleComplete = () => {
    const score = calculateScore();
    onComplete({
      success: score >= 60,
      score,
    });
  };

  const getCurrentProcessor = () => {
    return state.processors.find(p => p.id === state.currentProcessor);
  };

  return (
    <div className="minigame-container">
      <Title level={3}>Mastering Chain</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Mastering Preset">
          <Select
            value={state.selectedPreset}
            onChange={handlePresetChange}
            style={{ width: 200 }}
          >
            {PRESETS.map(preset => (
              <Option key={preset.value} value={preset.value}>
                {preset.label}
              </Option>
            ))}
          </Select>
        </Card>

        <Card title="Processor Selection">
          <Space wrap>
            {state.processors.map(processor => (
              <Card
                key={processor.id}
                size="small"
                style={{
                  width: 150,
                  border: state.currentProcessor === processor.id ? '2px solid #1890ff' : undefined,
                }}
                onClick={() => handleProcessorChange(processor.id)}
              >
                <Space direction="vertical">
                  <Text>{processor.name}</Text>
                  <Switch
                    checked={processor.enabled}
                    onChange={(checked: boolean) => handleProcessorToggle(processor.id, checked)}
                  />
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {getCurrentProcessor() && (
          <Card title={`${getCurrentProcessor()?.name} Controls`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(getCurrentProcessor()?.parameters || {}).map(([param, value]) => (
                <React.Fragment key={param}>
                  <Text>{param}</Text>
                  <Slider
                    min={0}
                    max={100}
                    value={value}
                    onChange={(newValue: number) => handleParameterChange(state.currentProcessor, param, newValue)}
                  />
                </React.Fragment>
              ))}
            </Space>
          </Card>
        )}

        <Space>
          <Button
            type="primary"
            icon={state.isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
          >
            {state.isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button type="primary" onClick={handleComplete}>
            Complete Mastering
          </Button>
        </Space>
      </Space>
    </div>
  );
}; 