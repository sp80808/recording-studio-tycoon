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
// Import MinigameManagerProps from types/game.ts to ensure consistency
// PlayerProgress is already imported on line 5, so remove duplicate here.
import { MinigameManagerProps as MinigameManagerPropsType } from '@/types/game'; 

// Use the imported type for props
export const MinigameManager: React.FC<MinigameManagerPropsType> = ({
  isOpen,
  gameType,
  onReward,
  onClose,
  // difficulty and initialProgress are not in MinigameManagerPropsType from types/game.ts
  // We'll handle them: difficulty can be a local const or optional prop, initialProgress needs a source.
}) => {
  const [showRewardsView, setShowRewardsView] = useState(false); // Renamed for clarity

  // Placeholder for initialProgress. In a real app, this would come from game state context or be passed.
  const mockInitialProgress: PlayerProgress = { 
    level: 1, 
    experience: 0, 
    skills: { technical: 0, creative: 0, business: 0 }, 
    achievements: [], 
    unlockedFeatures: [],
    reputation: { local: 0, regional: 0, national: 0, global: 0 }
  };
  const { playerProgress, recentRewards, recentAchievements, processMinigameCompletion, resetRecentRewards } = useRewards(mockInitialProgress) as UseRewardsReturn;
  // Note: `playerProgress` from useRewards is available if needed for display or logic.
  
  // Default difficulty if not provided via props (as it's not in MinigameManagerPropsType)
  const difficulty = 1; // Example: default to easy
  const difficultyString = difficulty <= 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard';

  // This function is called when a specific minigame component (e.g., RhythmTimingGame) completes.
  // It processes rewards and then calls the `onReward` prop passed from ActiveProject.
  const handleGameCompleteInternal = (score: number, creativityBonus = 0, technicalBonus = 0, xpBonus = 0) => {
    // Calculate generic bonuses if specific ones aren't provided by the minigame
    const genericCreativityBonus = score * 0.5; // Example
    const genericTechnicalBonus = score * 0.3;  // Example
    const genericXpBonus = score * 1;          // Example

    processMinigameCompletion(score, difficulty, gameType); // Use gameType
    
    // Call the onReward prop (from ActiveProject) with calculated or provided bonuses
    onReward(
      creativityBonus || genericCreativityBonus, 
      technicalBonus || genericTechnicalBonus, 
      xpBonus || genericXpBonus
    );
    setShowRewardsView(true); // Show the reward display screen
  };

  // This function is called when the reward display screen is closed.
  const handleRewardsDisplayClose = () => {
    setShowRewardsView(false);
    resetRecentRewards();
    // The main onClose (passed from ActiveProject) is used to close the entire MinigameManager modal.
    // No need to call onReward here again as it was called in handleGameCompleteInternal.
  };
  
  // Placeholder for onFail, if individual games need it.
  const handleGameFailInternal = () => {
    console.log(`Minigame ${gameType} failed.`);
    // Potentially show a failure message or apply penalties
    onClose(); // Close the minigame manager on failure
  };

  const renderGame = () => {
    // Pass handleGameCompleteInternal as onComplete to individual games
    // Pass handleGameFailInternal as onFail if the game supports it
    // Pass gameType as type, and difficulty for games that need it.
    switch (gameType) { // Use gameType from props
      case 'rhythm':
        return <RhythmTimingGame onComplete={handleGameCompleteInternal} onClose={onClose} difficulty={difficultyString} />;
      case 'mixing':
        return <MixingBoardGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'waveform':
        return <SoundWaveGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'beatmaking':
        // BeatMakingGame might need more props based on previous errors. Assuming type, difficulty, onFail for now.
        return <BeatMakingGame type={gameType} difficulty={difficultyString} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'vocal':
        return <VocalRecordingGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'mastering':
        return <MasteringGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'effectchain':
        return <EffectChainGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'acoustic':
        return <AcousticTreatmentGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'layering':
        return <InstrumentLayeringGame onComplete={handleGameCompleteInternal} onClose={onClose} />; // Assuming it doesn't need difficulty/type/onFail
      case 'tape_splicing':
        return <TapeSplicingGame difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'four_track_recording':
        return <FourTrackRecordingGame difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'midi_programming':
        return <MIDIProgrammingGame difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'digital_mixing':
        return <DigitalMixingGame difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'sample_editing':
        return <SampleEditingGame type={gameType} difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'sound_design':
        return <SoundDesignGame difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      case 'audio_restoration':
        return <AudioRestorationGame difficulty={difficulty} onComplete={handleGameCompleteInternal} onFail={handleGameFailInternal} onClose={onClose} />;
      default:
        console.warn(`Minigame type "${gameType}" not recognized.`);
        return null;
    }
  };

  if (!isOpen) { // Check isOpen prop to control rendering
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4"
      >
        <AnimatePresence>
          {showRewardsView ? ( // Changed from showRewards
            <RewardDisplay
              rewards={recentRewards}
              achievements={recentAchievements}
              onClose={handleRewardsDisplayClose} // Changed from handleRewardsClose
            />
          ) : (
            renderGame()
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
