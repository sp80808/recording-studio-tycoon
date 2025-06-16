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

interface DigitalMixingGameProps {
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
  compressor: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  reverb: {
    amount: number;
    decay: number;
    mix: number;
  };
  delay: {
    time: number;
    feedback: number;
    mix: number;
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
  selectedPreset: string;
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

const PRESETS = [
  { value: 'pop', label: 'Pop Mix' },
  { value: 'rock', label: 'Rock Mix' },
  { value: 'electronic', label: 'Electronic Mix' },
  { value: 'jazz', label: 'Jazz Mix' },
  { value: 'classical', label: 'Classical Mix' },
];

export const DigitalMixingGame: React.FC<DigitalMixingGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState } = useGameState();
  const [state, setState] = useState<GameState>({
    isActive: true,
    currentType: 'digitalMixing',
    difficulty,
    timeRemaining: 180,
    score: 0,
    progress: 0,
    isPlaying: false,
    currentChannel: 1,
    selectedPreset: 'pop',
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
        compressor: {
          threshold: 50,
          ratio: 50,
          attack: 50,
          release: 50,
        },
        reverb: {
          amount: 0,
          decay: 50,
          mix: 0,
        },
        delay: {
          time: 50,
          feedback: 0,
          mix: 0,
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
    param: keyof ChannelState | 
           'eq.low' | 'eq.mid' | 'eq.high' |
           'compressor.threshold' | 'compressor.ratio' | 'compressor.attack' | 'compressor.release' |
           'reverb.amount' | 'reverb.decay' | 'reverb.mix' |
           'delay.time' | 'delay.feedback' | 'delay.mix',
    value: number | boolean
  ) => {
    setState(prev => {
      const newChannels = { ...prev.channels };
      const channel = { ...newChannels[channelId] };

      if (param.startsWith('eq.')) {
        const eqParam = param.split('.')[1] as keyof ChannelState['eq'];
        channel.eq = { ...channel.eq, [eqParam]: value as number };
      } else if (param.startsWith('compressor.')) {
        const compParam = param.split('.')[1] as keyof ChannelState['compressor'];
        channel.compressor = { ...channel.compressor, [compParam]: value as number };
      } else if (param.startsWith('reverb.')) {
        const reverbParam = param.split('.')[1] as keyof ChannelState['reverb'];
        channel.reverb = { ...channel.reverb, [reverbParam]: value as number };
      } else if (param.startsWith('delay.')) {
        const delayParam = param.split('.')[1] as keyof ChannelState['delay'];
        channel.delay = { ...channel.delay, [delayParam]: value as number };
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

  const handlePresetChange = (preset: string) => {
    setState(prev => ({
      ...prev,
      selectedPreset: preset,
    }));
  };

  const calculateScore = () => {
    const channelScores = Object.entries(state.channels).map(([channelId, channel]) => {
      const faderScore = Math.abs(channel.fader - 50) <= 10 ? 10 : 0;
      const panScore = Math.abs(channel.pan - 50) <= 10 ? 10 : 0;
      const eqScore = (
        Math.abs(channel.eq.low - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.eq.mid - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.eq.high - 50) <= 10 ? 5 : 0
      );
      const compressorScore = (
        Math.abs(channel.compressor.threshold - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.compressor.ratio - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.compressor.attack - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.compressor.release - 50) <= 10 ? 5 : 0
      );
      const reverbScore = (
        Math.abs(channel.reverb.amount) <= 10 ? 5 : 0 +
        Math.abs(channel.reverb.decay - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.reverb.mix) <= 10 ? 5 : 0
      );
      const delayScore = (
        Math.abs(channel.delay.time - 50) <= 10 ? 5 : 0 +
        Math.abs(channel.delay.feedback) <= 10 ? 5 : 0 +
        Math.abs(channel.delay.mix) <= 10 ? 5 : 0
      );
      const muteSoloScore = (!channel.isMuted && !channel.isSolo) ? 10 : 0;

      return faderScore + panScore + eqScore + compressorScore + reverbScore + delayScore + muteSoloScore;
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
      <Title level={3}>Digital Mixing</Title>
      <Text>Time Remaining: {state.timeRemaining}s</Text>
      <Progress percent={state.progress} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Mix Preset">
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
              <Text>Compressor Threshold</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].compressor.threshold}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'compressor.threshold', value)}
              />
              <Text>Compressor Ratio</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].compressor.ratio}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'compressor.ratio', value)}
              />
              <Text>Compressor Attack</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].compressor.attack}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'compressor.attack', value)}
              />
              <Text>Compressor Release</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].compressor.release}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'compressor.release', value)}
              />
              <Text>Reverb Amount</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].reverb.amount}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'reverb.amount', value)}
              />
              <Text>Reverb Decay</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].reverb.decay}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'reverb.decay', value)}
              />
              <Text>Reverb Mix</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].reverb.mix}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'reverb.mix', value)}
              />
              <Text>Delay Time</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].delay.time}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'delay.time', value)}
              />
              <Text>Delay Feedback</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].delay.feedback}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'delay.feedback', value)}
              />
              <Text>Delay Mix</Text>
              <Slider
                min={0}
                max={100}
                value={state.channels[state.currentChannel].delay.mix}
                onChange={(value: number) => handleParameterChange(state.currentChannel, 'delay.mix', value)}
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
