import React, { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Switch } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  SoundOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface AnalogConsoleGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

interface Channel {
  id: number;
  name: string;
  icon: string;
}

interface ChannelState {
  fader: number;
  pan: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  aux: {
    send1: number;
    send2: number;
    send3: number;
  };
  isMuted: boolean;
  isSolo: boolean;
}

interface GameState {
  isActive: boolean;
  currentType: string;
  difficulty: number;
  timeRemaining: number;
  score: number;
  progress: number;
  isPlaying: boolean;
  currentChannel: number;
  channels: Record<number, ChannelState>;
}

const CHANNELS: Channel[] = [
  { id: 1, name: 'Kick', icon: '🥁' },
  { id: 2, name: 'Snare', icon: '🥁' },
  { id: 3, name: 'Hi-Hat', icon: '🥁' },
  { id: 4, name: 'Bass', icon: '🎸' },
  { id: 5, name: 'Guitar', icon: '🎸' },
  { id: 6, name: 'Vocals', icon: '🎤' },
  { id: 7, name: 'Synth', icon: '🎹' },
  { id: 8, name: 'FX', icon: '🎛️' },
];

export const AnalogConsoleGame: React.FC<AnalogConsoleGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<GameState>({
    isActive: true,
    currentType: 'analogConsole',
    difficulty,
    timeRemaining: 180,
    score: 0,
    progress: 0,
    isPlaying: false,
    currentChannel: 1,
    channels: CHANNELS.reduce((acc, channel) => ({
      ...acc,
      [channel.id]: {
        fader: 50,
        pan: 50,
        eq: {
          low: 50,
          mid: 50,
          high: 50,
        },
        aux: {
          send1: 0,
          send2: 0,
          send3: 0,
        },
        isMuted: false,
        isSolo: false,
      },
    }), {} as Record<number, ChannelState>),
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

  const handleChannelChange = (channelId: number) => {
    setState(prev => ({
      ...prev,
      currentChannel: channelId,
    }));
  };

  const handleParameterChange = (
    channelId: number,
    param: keyof ChannelState | 'eq.low' | 'eq.mid' | 'eq.high' | 'aux.send1' | 'aux.send2' | 'aux.send3',
    value: number | boolean
  ) => {
    setState(prev => {
      const newChannels = { ...prev.channels };
      const channel = { ...newChannels[channelId] };

      if (param.startsWith('eq.')) {
        const eqParam = param.split('.')[1] as keyof ChannelState['eq'];
        channel.eq = { ...channel.eq, [eqParam]: value as number };
      } else if (param.startsWith('aux.')) {
        const auxParam = param.split('.')[1] as keyof ChannelState['aux'];
        channel.aux = { ...channel.aux, [auxParam]: value as number };
      } else if (param === 'fader' || param === 'pan') {
        channel[param] = value as number;
      } else if (param === 'isMuted' || param === 'isSolo') {
        channel[param] = value as boolean;
      }
      // Add an else block here if there are other direct ChannelState params

      newChannels[channelId] = channel;
      return {
        ...prev,
        channels: newChannels,
      };
    });
  };

  const calculateScore = () => {
    const channelScores = Object.entries(state.channels).map(([channelId, channel]) => {
      const faderScore = Math.abs(channel.fader - 50) <= 10 ? 15 : 0;
      const panScore = Math.abs(channel.pan - 50) <= 10 ? 15 : 0;
      const eqScore = (
        Math.abs(channel.eq.low - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.eq.mid - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.eq.high - 50) <= 10 ? 5 : 0
      );
      const auxScore = (
        Math.abs(channel.aux.send1) <= 10 ? 5 : 0 +
        Math.abs(channel.aux.send2) <= 10 ? 5 : 0 +
        Math.abs(channel.aux.send3) <= 10 ? 5 : 0
      );
      const muteSoloScore = (!channel.isMuted && !channel.isSolo) ? 15 : 0;

      return faderScore + panScore + eqScore + auxScore + muteSoloScore;
    });

    return Math.min(100, Math.floor(
      channelScores.reduce((sum, score) => sum + score, 0) / 8
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
      <Title level={3}>Analog Console Mixing</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Channel Selection">
          <Space wrap>
            {CHANNELS.map(channel => (
              <Card
                key={channel.id}
                size="small"
                style={{
                  width: 150,
                  border: state.currentChannel === channel.id ? '2px solid #1890ff' : undefined,
                }}
                onClick={() => handleChannelChange(channel.id)}
              >
                <Space>
                  <span>{channel.icon}</span>
                  <Text>{channel.name}</Text>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {state.currentChannel && (
          <Card title={`Channel ${state.currentChannel} Controls`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Fader</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].fader}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'fader', value)}
              />
              <Text>Pan</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].pan}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'pan', value)}
              />
              <Text>EQ Low</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].eq.low}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'eq.low', value)}
              />
              <Text>EQ Mid</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].eq.mid}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'eq.mid', value)}
              />
              <Text>EQ High</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].eq.high}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'eq.high', value)}
              />
              <Text>Aux Send 1</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].aux.send1}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'aux.send1', value)}
              />
              <Text>Aux Send 2</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].aux.send2}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'aux.send2', value)}
              />
              <Text>Aux Send 3</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].aux.send3}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'aux.send3', value)}
              />
              <Space>
                <Switch
                  checked={state.channels[state.currentChannel].isMuted}
                  onChange={(checked: boolean) => handleParameterChange(state.currentChannel, 'isMuted', checked)}
                />
                <Text>Mute</Text>
              </Space>
              <Space>
                <Switch
                  checked={state.channels[state.currentChannel].isSolo}
                  onChange={(checked: boolean) => handleParameterChange(state.currentChannel, 'isSolo', checked)}
                />
                <Text>Solo</Text>
              </Space>
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
            Complete Mix
          </Button>
        </Space>
      </Space>
    </div>
  );
};
