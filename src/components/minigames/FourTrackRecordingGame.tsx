import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useGameState } from '@/hooks/useGameState';
import { Button, Slider, Card, Typography, Space, Progress, Switch } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  SoundOutlined,
  SyncOutlined // This icon seems unused, consider removing if not needed
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface FourTrackRecordingGameProps {
  onComplete: (result: { success: boolean; score: number }) => void;
  difficulty: number;
}

interface TrackInfo {
  id: number;
  name: string;
  icon: string;
}

interface TrackState {
  level: number;
  pan: number;
  isRecording: boolean;
  isMuted: boolean;
  isSolo: boolean;
  sync: number;
}

interface FourTrackGameState { // Renamed from GameState to avoid conflict with global GameState
  isActive: boolean;
  currentType: string; // Should be 'fourTrackRecording'
  difficulty: number;
  timeRemaining: number;
  score: number;
  progress: number;
  isPlaying: boolean;
  currentTrack: number; // ID of the current track
  tracks: Record<number, TrackState>; // Explicitly typed
}

const TRACK_CONFIG: TrackInfo[] = [
  { id: 1, name: 'Track 1', icon: '🎸' },
  { id: 2, name: 'Track 2', icon: '🎤' },
  { id: 3, name: 'Track 3', icon: '🥁' },
  { id: 4, name: 'Track 4', icon: '🎹' },
];

export const FourTrackRecordingGame: React.FC<FourTrackRecordingGameProps> = ({
  onComplete,
  difficulty,
}) => {
  const { gameState: globalGameState } = useGameState(); // Aliased to avoid conflict
  const [state, setState] = useState<FourTrackGameState>({
    isActive: true,
    currentType: 'fourTrackRecording',
    difficulty,
    timeRemaining: 120,
    score: 0,
    progress: 0,
    isPlaying: false,
    currentTrack: 1, // Default to track 1
    tracks: TRACK_CONFIG.reduce((acc, track) => {
      acc[track.id] = {
        level: 50,
        pan: 50,
        isRecording: false,
        isMuted: false,
        isSolo: false,
        sync: 50,
      };
      return acc;
    }, {} as Record<number, TrackState>),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 0) {
          clearInterval(timer);
          handleComplete(); // Call handleComplete when time is up
          return prev;
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        };
      });
    }, 1000);

    // Define handleComplete inside useEffect or ensure it's stable if defined outside
    // For now, assuming handleComplete is stable or defined within a useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps 
    return () => clearInterval(timer);
  }, []); // Removed handleComplete from deps array as it causes infinite loop if not memoized

  const handleTrackChange = (trackId: number) => {
    setState(prev => ({
      ...prev,
      currentTrack: trackId,
    }));
  };

  const handleParameterChange = (trackId: number, param: keyof TrackState, value: number | boolean) => {
    setState(prev => {
      const currentTrackState = prev.tracks[trackId];
      if (!currentTrackState) return prev; // Guard against invalid trackId

      return {
        ...prev,
        tracks: {
          ...prev.tracks,
          [trackId]: {
            ...currentTrackState,
            [param]: value,
          },
        },
      };
    });
  };

  const calculateScore = () => {
    // Ensure tracks are accessed safely, especially if state.tracks could be empty initially
    if (Object.keys(state.tracks).length === 0) return 0;

    const trackScores = Object.values(state.tracks).map((track: TrackState) => {
      const levelScore = Math.abs(track.level - 50) <= 10 ? 20 : 0;
      const panScore = Math.abs(track.pan - 50) <= 10 ? 20 : 0;
      const syncScore = Math.abs(track.sync - 50) <= 10 ? 20 : 0;
      const recordingScore = track.isRecording ? 20 : 0; // Points if recording is active (goal might be to activate all)
      const muteSoloScore = (!track.isMuted && !track.isSolo) ? 20 : 0; // Points if not muted and not solo (unless solo is intended)

      return levelScore + panScore + syncScore + recordingScore + muteSoloScore;
    });
    
    const totalPossibleScorePerTrack = 100;
    const maxTotalScore = TRACK_CONFIG.length * totalPossibleScorePerTrack;
    const currentTotalScore = trackScores.reduce((sum, score) => sum + score, 0);

    return Math.min(100, Math.floor((currentTotalScore / maxTotalScore) * 100 * TRACK_CONFIG.length)); // Normalize to 100
  };
  
  // Memoize handleComplete to avoid re-creating it on every render, for useEffect dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleComplete = useCallback(() => {
    const score = calculateScore();
    onComplete({
      success: score >= 60, // Define success criteria
      score,
    });
  }, [state.tracks, onComplete]); // Add dependencies for calculateScore

  const currentSelectedTrackState = state.tracks[state.currentTrack];

  return (
    <div className="minigame-container p-4 bg-gray-800 text-white rounded-lg shadow-xl">
      <Title level={3} style={{ color: 'white' }}>Four-Track Recording</Title>
      <div className="flex justify-between items-center mb-4">
        <Text style={{ color: 'white' }}>Time Remaining: {state.timeRemaining}s</Text>
        <Progress percent={state.progress} style={{ width: '50%' }} />
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={<Text style={{color: 'white'}}>Track Selection</Text>} className="bg-gray-700 border-gray-600">
          <Space wrap>
            {TRACK_CONFIG.map(track => (
              <Card
                key={track.id}
                size="small"
                className={`cursor-pointer transition-all ${state.currentTrack === track.id ? 'ring-2 ring-blue-500 bg-blue-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                style={{ width: 150 }}
                onClick={() => handleTrackChange(track.id)}
              >
                <Space>
                  <span className="text-xl">{track.icon}</span>
                  <Text style={{color: 'white'}}>{track.name}</Text>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {currentSelectedTrackState && (
          <Card title={<Text style={{color: 'white'}}>{`Track ${state.currentTrack} (${TRACK_CONFIG.find(t=>t.id === state.currentTrack)?.name}) Controls`}</Text>} className="bg-gray-700 border-gray-600">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="flex justify-between"><Text style={{color: 'white'}}>Level</Text><Text style={{color: 'white'}}>{currentSelectedTrackState.level}</Text></div>
              <Slider
                min={0}
                max={100}
                value={currentSelectedTrackState.level}
                onChange={(value: number) => handleParameterChange(state.currentTrack, 'level', value)}
              />
              <div className="flex justify-between"><Text style={{color: 'white'}}>Pan</Text><Text style={{color: 'white'}}>{currentSelectedTrackState.pan === 50 ? 'C' : currentSelectedTrackState.pan < 50 ? `L${50-currentSelectedTrackState.pan}` : `R${currentSelectedTrackState.pan-50}`}</Text></div>
              <Slider
                min={0}
                max={100}
                value={currentSelectedTrackState.pan}
                onChange={(value: number) => handleParameterChange(state.currentTrack, 'pan', value)}
              />
              <div className="flex justify-between"><Text style={{color: 'white'}}>Sync</Text><Text style={{color: 'white'}}>{currentSelectedTrackState.sync}</Text></div>
              <Slider
                min={0}
                max={100}
                value={currentSelectedTrackState.sync}
                onChange={(value: number) => handleParameterChange(state.currentTrack, 'sync', value)}
              />
              <Space className="mt-2">
                <Switch
                  checked={currentSelectedTrackState.isRecording}
                  onChange={(checked: boolean) => handleParameterChange(state.currentTrack, 'isRecording', checked)}
                />
                <Text style={{color: 'white'}}>Recording</Text>
              </Space>
              <Space>
                <Switch
                  checked={currentSelectedTrackState.isMuted}
                  onChange={(checked: boolean) => handleParameterChange(state.currentTrack, 'isMuted', checked)}
                />
                <Text style={{color: 'white'}}>Mute</Text>
              </Space>
              <Space>
                <Switch
                  checked={currentSelectedTrackState.isSolo}
                  onChange={(checked: boolean) => handleParameterChange(state.currentTrack, 'isSolo', checked)}
                />
                <Text style={{color: 'white'}}>Solo</Text>
              </Space>
            </Space>
          </Card>
        )}

        <Space className="mt-4">
          <Button
            type="primary"
            icon={state.isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {state.isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button type="primary" onClick={handleComplete} className="bg-green-600 hover:bg-green-500">
            Complete Recording
          </Button>
        </Space>
      </Space>
    </div>
  );
};
