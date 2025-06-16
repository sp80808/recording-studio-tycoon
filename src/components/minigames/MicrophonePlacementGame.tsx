import React, { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress } from 'antd';
import { SoundOutlined, AimOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface MicrophonePlacementGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

const INSTRUMENTS = {
  vocals: { name: 'Vocals', icon: '🎤' },
  guitar: { name: 'Electric Guitar', icon: '🎸' },
  bass: { name: 'Bass', icon: '🎸' },
  drums: { name: 'Drums', icon: '🥁' },
  piano: { name: 'Piano', icon: '🎹' },
  sax: { name: 'Saxophone', icon: '🎷' },
};

const MICROPHONE_TYPES = {
  condenser: { name: 'Condenser', icon: '🎙️' },
  dynamic: { name: 'Dynamic', icon: '🎙️' },
  ribbon: { name: 'Ribbon', icon: '🎙️' },
};

export const MicrophonePlacementGame: React.FC<MicrophonePlacementGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState({
    isActive: true,
    currentType: 'microphonePlacement',
    difficulty,
    timeRemaining: 90,
    score: 0,
    progress: 0,
    selectedInstrument: 'vocals',
    selectedMic: 'condenser',
    distance: 50,
    angle: 50,
    height: 50,
    roomTreatment: 50,
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

  const handleInstrumentChange = (instrument: string) => {
    setState(prev => ({
      ...prev,
      selectedInstrument: instrument,
    }));
  };

  const handleMicChange = (mic: string) => {
    setState(prev => ({
      ...prev,
      selectedMic: mic,
    }));
  };

  const handleParameterChange = (param: 'distance' | 'angle' | 'height' | 'roomTreatment', value: number) => {
    setState(prev => ({
      ...prev,
      [param]: value,
    }));
  };

  const calculateScore = () => {
    const instrumentScore = 20; // Base score for selecting an instrument
    const micScore = 20; // Base score for selecting a microphone

    // Calculate optimal ranges based on instrument and mic type
    const optimalRanges = {
      vocals: { distance: [40, 60], angle: [45, 55], height: [45, 55] },
      guitar: { distance: [30, 50], angle: [40, 50], height: [40, 50] },
      bass: { distance: [20, 40], angle: [35, 45], height: [35, 45] },
      drums: { distance: [50, 70], angle: [50, 60], height: [50, 60] },
      piano: { distance: [60, 80], angle: [55, 65], height: [55, 65] },
      sax: { distance: [30, 50], angle: [40, 50], height: [40, 50] },
    };

    const ranges = optimalRanges[state.selectedInstrument as keyof typeof optimalRanges];
    const distanceScore = ranges.distance[0] <= state.distance && state.distance <= ranges.distance[1] ? 20 : 0;
    const angleScore = ranges.angle[0] <= state.angle && state.angle <= ranges.angle[1] ? 20 : 0;
    const heightScore = ranges.height[0] <= state.height && state.height <= ranges.height[1] ? 20 : 0;

    return Math.min(100, Math.floor(
      instrumentScore +
      micScore +
      distanceScore +
      angleScore +
      heightScore
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
      <Title level={3}>Microphone Placement</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Instrument Selection">
          <Space wrap>
            {Object.entries(INSTRUMENTS).map(([key, { name, icon }]) => (
              <Card
                key={key}
                size="small"
                style={{
                  width: 150,
                  border: state.selectedInstrument === key ? '2px solid #1890ff' : undefined,
                }}
                onClick={() => handleInstrumentChange(key)}
              >
                <Space>
                  <span>{icon}</span>
                  <Text>{name}</Text>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        <Card title="Microphone Selection">
          <Space wrap>
            {Object.entries(MICROPHONE_TYPES).map(([key, { name, icon }]) => (
              <Card
                key={key}
                size="small"
                style={{
                  width: 150,
                  border: state.selectedMic === key ? '2px solid #1890ff' : undefined,
                }}
                onClick={() => handleMicChange(key)}
              >
                <Space>
                  <span>{icon}</span>
                  <Text>{name}</Text>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        <Card title="Placement Parameters">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Distance</Text>
            <Slider
              min={0}
              max={100}
              value={state.distance}
              onChange={(value: number) => handleParameterChange('distance', value)}
            />
            <Text>Angle</Text>
            <Slider
              min={0}
              max={100}
              value={state.angle}
              onChange={(value: number) => handleParameterChange('angle', value)}
            />
            <Text>Height</Text>
            <Slider
              min={0}
              max={100}
              value={state.height}
              onChange={(value: number) => handleParameterChange('height', value)}
            />
            <Text>Room Treatment</Text>
            <Slider
              min={0}
              max={100}
              value={state.roomTreatment}
              onChange={(value: number) => handleParameterChange('roomTreatment', value)}
            />
          </Space>
        </Card>

        <Button type="primary" onClick={handleComplete}>
          Set Microphone
        </Button>
      </Space>
    </div>
  );
};
