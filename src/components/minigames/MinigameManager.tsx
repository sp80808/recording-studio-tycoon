import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RhythmTimingGame } from './RhythmTimingGame';
import { SoundWaveGame } from './SoundWaveGame';
import { BeatMakingGame } from './BeatMakingGame';
import { MasteringGame } from './MasteringGame';
import { EffectChainGame } from './EffectChainGame';
import { AcousticTreatmentGame } from './AcousticTreatmentGame';
import { InstrumentLayeringGame } from './InstrumentLayeringGame';
import { LyricFocusGame } from './LyricFocusGame';
import { MicrophonePlacementGame } from './MicrophonePlacementGame';
import { MixingMinigame } from './MixingMinigame';
import { VocalRecordingMinigame } from './VocalRecordingMinigame';
import { GuitarPedalBoardGame } from './GuitarPedalBoardGame';
import { PatchBayGame } from './PatchBayGame';
import { AnalogConsoleGame } from './AnalogConsoleGame';
import { DigitalMixingGame } from './DigitalMixingGame';
import { HybridMixingGame } from './HybridMixingGame';
import { MasteringChainGame } from './MasteringChainGame';
import { AudioRestorationGame } from './AudioRestorationGame';
import { MidiProgrammingGame } from './MidiProgrammingGame.tsx';
import { SamplingSequencingGame } from './SamplingSequencingGame';
import { DigitalDistributionGame } from './DigitalDistributionGame';
import { SocialMediaPromotionGame } from './SocialMediaPromotionGame';
import { StreamingOptimizationGame } from './StreamingOptimizationGame';
import { AIMasteringGame } from './AIMasteringGame';
import { TapeSplicingGame } from './TapeSplicingGame'; 
import { FourTrackRecordingGame } from './FourTrackRecordingGame';

import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { toast } from '@/hooks/use-toast';
import { MinigameType } from '@/types/miniGame';
import { MusicGenre } from '@/types/charts';
import { GameState } from '@/types/game';

export interface MinigameManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
  onComplete: (type: MinigameType, score: number) => void;
  difficulty: number; // Expecting a number (e.g., 1-10)
  gameState: GameState; 
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward,
  onComplete,
  difficulty, // This is a number
  gameState,
}) => {
  const [showGame, setShowGame] = useState(true);
  const backgroundMusic = useBackgroundMusic();

  const handleGenericGameComplete = (score: number) => {
    setShowGame(false);
    let creativityBonus = 0;
    let technicalBonus = 0;
    const xpBonus = Math.floor(Math.max(1, score / 50)); 

    switch (gameType) {
      case 'rhythmTiming': 
        creativityBonus = Math.floor(score / 8); technicalBonus = Math.floor(score / 12); break;
      case 'mixingBoard': 
        creativityBonus = Math.floor(score / 12); technicalBonus = Math.floor(score / 8); break;
      default:
        creativityBonus = Math.floor(score / 10); technicalBonus = Math.floor(score / 10); break;
    }
    onReward(creativityBonus, technicalBonus, xpBonus);
    onComplete(gameType, score);
    toast({
      title: "Minigame Complete!",
      description: `Score: ${score}. Earned +${creativityBonus}C, +${technicalBonus}T, +${xpBonus}XP`,
    });
    onClose(); 
  };
  
  const handleSpecificGameComplete = (result: { success: boolean; score: number } | number) => {
    const score = typeof result === 'number' ? result : result.score;
    handleGenericGameComplete(score);
  };
  
  const handleCloseDialog = () => {
    setShowGame(true); 
    onClose();
  };

  // Helper to convert numeric difficulty to the specific string type RhythmTimingGame expects
  const getRhythmGameDifficultyString = (numDiff: number): 'easy' | 'medium' | 'hard' => {
    if (numDiff <= 3) return 'easy';
    if (numDiff <= 7) return 'medium';
    return 'hard';
  };
  


  const renderGame = () => {
    if (!showGame) return null;

    const commonNumericDifficultyProps = {
      onComplete: handleSpecificGameComplete,
      onClose: handleCloseDialog,
      difficulty: difficulty, // Pass the original number
    };
    
    const beatMakingProps = {
        ...commonNumericDifficultyProps,
        backgroundMusic: backgroundMusic,
    };

    const lyricFocusProps = {
      onComplete: (score: number, lyricalQualityBonus: number) => {
        console.log(`Lyric Focus Bonus (not directly used by manager): +${lyricalQualityBonus} Lyrical Quality`);
        handleSpecificGameComplete(score);
      },
      onClose: handleCloseDialog,
      genre: gameState.activeProject?.genre as MusicGenre || 'pop',
      mood: gameState.activeProject?.targetMood || 'upbeat',
      difficulty: difficulty, // Pass numeric difficulty as LyricFocusGame expects a number
    };


    switch (gameType) {
      case 'rhythmTiming': 
        return <RhythmTimingGame 
                    onComplete={handleSpecificGameComplete} 
                    onClose={handleCloseDialog} 
                    difficulty={getRhythmGameDifficultyString(difficulty)} // Use specific converter
                />;
      
      // Games expecting numeric difficulty
      case 'lyricFocus': return <LyricFocusGame {...lyricFocusProps} />;
      case 'mixingBoard': return <MixingMinigame {...commonNumericDifficultyProps} />;
      case 'soundWave': return <SoundWaveGame {...commonNumericDifficultyProps} />;
      case 'beatMaking': return <BeatMakingGame {...beatMakingProps} />;
      case 'vocalRecording': return <VocalRecordingMinigame {...commonNumericDifficultyProps} />;
      case 'mastering': return <MasteringGame {...commonNumericDifficultyProps} />;
      case 'effectChain': return <EffectChainGame {...commonNumericDifficultyProps} genre="rock" />;
      case 'acousticTuning': return <AcousticTreatmentGame {...commonNumericDifficultyProps} recordingType="vocal" />;
      case 'instrumentLayering': return <InstrumentLayeringGame {...commonNumericDifficultyProps} genre="pop" />;
      case 'pedalboard': return <GuitarPedalBoardGame {...commonNumericDifficultyProps} />;
      case 'patchbay': return <PatchBayGame {...commonNumericDifficultyProps} />;
      case 'microphonePlacement': return <MicrophonePlacementGame {...commonNumericDifficultyProps} />;
      case 'analogConsole': return <AnalogConsoleGame {...commonNumericDifficultyProps} />;
      case 'digitalMixing': return <DigitalMixingGame {...commonNumericDifficultyProps} />;
      case 'hybridMixing': return <HybridMixingGame {...commonNumericDifficultyProps} />;
      case 'masteringChain': return <MasteringChainGame {...commonNumericDifficultyProps} />;
      case 'audioRestoration': return <AudioRestorationGame {...commonNumericDifficultyProps} />;
      case 'midiProgramming': return <MidiProgrammingGame {...commonNumericDifficultyProps} />;
      case 'sampleEditing': return <SamplingSequencingGame {...commonNumericDifficultyProps} />;
      case 'digitalDistribution': return <DigitalDistributionGame {...commonNumericDifficultyProps} />;
      case 'socialMediaPromotion': return <SocialMediaPromotionGame {...commonNumericDifficultyProps} />;
      case 'streamingOptimization': return <StreamingOptimizationGame {...commonNumericDifficultyProps} />;
      case 'aiMastering': return <AIMasteringGame {...commonNumericDifficultyProps} />;
      case 'tapeSplicing': return <TapeSplicingGame {...commonNumericDifficultyProps} />;
      case 'fourTrackRecording': return <FourTrackRecordingGame {...commonNumericDifficultyProps} />;
      
      default:
        console.warn("Unhandled gameType in MinigameManager renderGame:", gameType);
        return <div>Minigame "{typeof gameType === 'string' ? gameType : 'Unknown'}" not implemented in manager.</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-4xl bg-transparent border-0 p-0">
        {renderGame()}
      </DialogContent>
    </Dialog>
  );
};
