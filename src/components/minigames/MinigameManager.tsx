import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRewards, UseRewardsReturn } from '@/hooks/useRewards';
import { RewardDisplay } from '@/components/rewards/RewardDisplay';
import { MinigameType, Achievement, PlayerProgress, MinigameReward } from '@/types/game';
import { RhythmTimingGame } from './RhythmTimingGame';
import { MixingBoardGame } from './MixingBoardGame';
import { SoundWaveGame } from './SoundWaveGame';
import { BeatMakingGame } from './BeatMakingGame';
import { VocalRecordingGame } from './VocalRecordingGame';
import { MasteringGame } from './MasteringGame';
import { EffectChainGame } from './EffectChainGame';
import { AcousticTreatmentGame } from './AcousticTreatmentGame';
import { InstrumentLayeringGame } from './InstrumentLayeringGame';
import { TapeSplicingGame } from './TapeSplicingGame';
import { FourTrackRecordingGame } from './FourTrackRecordingGame';
import { MIDIProgrammingGame } from './MIDIProgrammingGame';
import { DigitalMixingGame } from './DigitalMixingGame';
import { SampleEditingGame } from './SampleEditingGame';
import { SoundDesignGame } from './SoundDesignGame';
import { AudioRestorationGame } from './AudioRestorationGame';

interface MinigameManagerProps {
  type: MinigameType;
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
  initialProgress: PlayerProgress;
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  type,
  difficulty,
  onComplete,
  onFail,
  onClose,
  initialProgress
}) => {
  const [showRewards, setShowRewards] = useState(false);
  const { playerProgress, recentRewards, recentAchievements, processMinigameCompletion, resetRecentRewards } = useRewards(initialProgress) as UseRewardsReturn;

  const difficultyString = difficulty <= 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard';

  const handleGameComplete = (score: number) => {
    processMinigameCompletion(score, difficulty, type);
    setShowRewards(true);
  };

  const handleRewardsClose = () => {
    setShowRewards(false);
    resetRecentRewards();
    onComplete(playerProgress.experience);
  };

  const renderGame = () => {
    switch (type) {
      case 'rhythm':
        return <RhythmTimingGame onComplete={handleGameComplete} onClose={onClose} difficulty={difficultyString} />;
      case 'mixing':
        return <MixingBoardGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'waveform':
        return <SoundWaveGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'beatmaking':
        return <BeatMakingGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'vocal':
        return <VocalRecordingGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'mastering':
        return <MasteringGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'effectchain':
        return <EffectChainGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'acoustic':
        return <AcousticTreatmentGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'layering':
        return <InstrumentLayeringGame onComplete={handleGameComplete} onClose={onClose} />;
      case 'tape_splicing':
        return <TapeSplicingGame difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      case 'four_track_recording':
        return <FourTrackRecordingGame difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      case 'midi_programming':
        return <MIDIProgrammingGame difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      case 'digital_mixing':
        return <DigitalMixingGame difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      case 'sample_editing':
        return <SampleEditingGame type={type} difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      case 'sound_design':
        return <SoundDesignGame difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      case 'audio_restoration':
        return <AudioRestorationGame difficulty={difficulty} onComplete={handleGameComplete} onFail={onFail} onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4"
      >
        <AnimatePresence>
          {showRewards ? (
            <RewardDisplay
              rewards={recentRewards}
              achievements={recentAchievements}
              onClose={handleRewardsClose}
            />
          ) : (
            renderGame()
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
