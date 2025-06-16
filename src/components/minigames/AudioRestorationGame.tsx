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

interface AudioRestorationGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

interface Tool {
  id: string;
  name: string;
  type: 'noise' | 'click' | 'hum' | 'declick' | 'declip';
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
  currentTool: string;
  tools: Tool[];
  selectedPreset: string;
}

const TOOLS: Tool[] = [
  {
    id: 'noise1',
    name: 'Noise Reduction',
    type: 'noise',
    enabled: true,
    parameters: {
      threshold: 50,
      reduction: 50,
      smoothing: 50,
      sensitivity: 50,
    },
  },
  {
    id: 'click1',
    name: 'Click Removal',
    type: 'click',
    enabled: true,
    parameters: {
      threshold: 50,
      sensitivity: 50,
      window: 50,
    },
  },
  {
    id: 'hum1',
    name: 'Hum Removal',
    type: 'hum',
    enabled: true,
    parameters: {
      frequency: 50,
      bandwidth: 50,
      reduction: 50,
    },
  },
  {
    id: 'declick1',
    name: 'Declicker',
    type: 'declick',
    enabled: true,
    parameters: {
      threshold: 50,
      sensitivity: 50,
      window: 50,
    },
  },
  {
    id: 'declip1',
    name: 'Declipper',
    type: 'declip',
    enabled: true,
    parameters: {
      threshold: 50,
      smoothing: 50,
      recovery: 50,
    },
  },
];

const PRESETS = [
  { value: 'vinyl', label: 'Vinyl Restoration' },
  { value: 'tape', label: 'Tape Restoration' },
  { value: 'live', label: 'Live Recording' },
  { value: 'archival', label: 'Archival Material' },
  { value: 'modern', label: 'Modern Recording' },
];

export const AudioRestorationGame: React.FC<AudioRestorationGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<GameState>({
    isActive: true,
    currentType: 'audioRestoration',
    difficulty,
    timeRemaining: 180,
    score: 0,
    progress: 0,
    isPlaying: false,
    currentTool: TOOLS[0].id,
    tools: TOOLS,
    selectedPreset: 'vinyl',
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

  const handleToolChange = (toolId: string) => {
    setState(prev => ({
      ...prev,
      currentTool: toolId,
    }));
  };

  const handleParameterChange = (toolId: string, param: string, value: number) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.map(tool => {
        if (tool.id === toolId) {
          return {
            ...tool,
            parameters: {
              ...tool.parameters,
              [param]: value,
            },
          };
        }
        return tool;
      }),
    }));
  };

  const handleToolToggle = (toolId: string, enabled: boolean) => {
    setState(prev => ({
      ...prev,
      tools: prev.tools.map(tool => {
        if (tool.id === toolId) {
          return {
            ...tool,
            enabled,
          };
        }
        return tool;
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
    const toolScores = state.tools.map(tool => {
      if (!tool.enabled) return 0;

      let score = 0;
      switch (tool.type) {
        case 'noise':
          score = Object.values(tool.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 25 : 0), 0);
          break;
        case 'click':
          score = Object.values(tool.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 33 : 0), 0);
          break;
        case 'hum':
          score = Object.values(tool.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 33 : 0), 0);
          break;
        case 'declick':
          score = Object.values(tool.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 33 : 0), 0);
          break;
        case 'declip':
          score = Object.values(tool.parameters).reduce((sum, value) => 
            sum + (Math.abs(value - 50) <= 10 ? 33 : 0), 0);
          break;
      }
      return score;
    });

    return Math.min(100, Math.floor(
      toolScores.reduce((sum, score) => sum + score, 0) / state.tools.length
    ));
  };

  const handleComplete = () => {
    const score = calculateScore();
    onComplete({
      success: score >= 60,
      score,
    });
  };

  const getCurrentTool = () => {
    return state.tools.find(t => t.id === state.currentTool);
  };

  return (
    <div className="minigame-container">
      <Title level={3}>Audio Restoration</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Restoration Preset">
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

        <Card title="Tool Selection">
          <Space wrap>
            {state.tools.map(tool => (
              <Card
                key={tool.id}
                size="small"
                style={{
                  width: 150,
                  border: state.currentTool === tool.id ? '2px solid #1890ff' : undefined,
                }}
                onClick={() => handleToolChange(tool.id)}
              >
                <Space direction="vertical">
                  <Text>{tool.name}</Text>
                  <Switch
                    checked={tool.enabled}
                    onChange={(checked: boolean) => handleToolToggle(tool.id, checked)}
                  />
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {getCurrentTool() && (
          <Card title={`${getCurrentTool()?.name} Controls`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(getCurrentTool()?.parameters || {}).map(([param, value]) => (
                <React.Fragment key={param}>
                  <Text>{param}</Text>
                  <Slider
                    min={0}
                    max={100}
                    value={value}
                    onChange={(newValue: number) => handleParameterChange(state.currentTool, param, newValue)}
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
            Complete Restoration
          </Button>
        </Space>
      </Space>
    </div>
  );
}; 