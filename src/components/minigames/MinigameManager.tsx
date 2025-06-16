import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RhythmTimingGame } from './RhythmTimingGame'; // Removed RhythmTimingGameProps import
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
import { MidiProgrammingGame } from './MidiProgrammingGame';
import { SamplingSequencingGame } from './SamplingSequencingGame';
import { DigitalDistributionGame } from './DigitalDistributionGame';
import { SocialMediaPromotionGame } from './SocialMediaPromotionGame';
import { StreamingOptimizationGame } from './StreamingOptimizationGame';
import { AIMasteringGame } from './AIMasteringGame';
import { TapeSplicingGame } from './TapeSplicingGame'; 
import { FourTrackRecordingGame } from './FourTrackRecordingGame';

import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { toast } from '@/hooks/use-toast';
import { MinigameType, MiniGameDifficulty } from '@/types/miniGame';
import { MusicGenre } from '@/types/charts';
import { GameState } from '@/types/game';

interface MinigameManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
  onComplete: (type: MinigameType, score: number) => void;
  difficulty: number; 
  gameState: GameState; 
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward,
  onComplete,
  difficulty, 
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
      case 'soundWave': 
        creativityBonus = Math.floor(score / 10); technicalBonus = Math.floor(score / 10); break;
      case 'beatMaking': 
        creativityBonus = Math.floor(score / 6); technicalBonus = Math.floor(score / 15); break;
      case 'vocalRecording': 
        creativityBonus = Math.floor(score / 7); technicalBonus = Math.floor(score / 11); break;
      case 'mastering':
        creativityBonus = Math.floor(score / 15); technicalBonus = Math.floor(score / 6); break;
      case 'effectChain':
        creativityBonus = Math.floor(score / 8); technicalBonus = Math.floor(score / 10); break;
      case 'acousticTuning': 
        creativityBonus = Math.floor(score / 12); technicalBonus = Math.floor(score / 8); break;
      case 'instrumentLayering': 
        creativityBonus = Math.floor(score / 9); technicalBonus = Math.floor(score / 11); break;
      case 'microphonePlacement':
        creativityBonus = Math.floor(score / 10); technicalBonus = Math.floor(score / 7); break;
      case 'masteringChain':
        creativityBonus = Math.floor(score / 15); technicalBonus = Math.floor(score / 5); break;
      case 'lyricFocus': 
        creativityBonus = Math.floor(score / 7); 
        break;
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

  const renderGame = () => {
    if (!showGame) return null;

    const commonMinigameProps = {
      onComplete: handleSpecificGameComplete,
      onClose: handleCloseDialog,
      difficulty: difficulty, 
    };
    
    const beatMakingProps = {
        onComplete: (score: number) => handleSpecificGameComplete(score),
        onClose: handleCloseDialog,
        difficulty: difficulty, 
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
      difficulty: difficulty, 
    };

    const getRhythmGameDifficulty = (numDiff: number): 'easy' | 'medium' | 'hard' => {
        if (numDiff <= 3) return 'easy';
        if (numDiff <= 7) return 'medium';
        return 'hard';
    };

    switch (gameType) {
      case 'rhythmTiming': 
        return <RhythmTimingGame 
                    onComplete={handleSpecificGameComplete} 
                    onClose={handleCloseDialog} 
                    difficulty={getRhythmGameDifficulty(difficulty)} 
                />;
      case 'mixingBoard': return <MixingMinigame {...commonMinigameProps} />;
      case 'soundWave': return <SoundWaveGame {...commonMinigameProps} />;
      case 'beatMaking': return <BeatMakingGame {...beatMakingProps} />;
      case 'vocalRecording': return <VocalRecordingMinigame {...commonMinigameProps} />;
      case 'mastering': return <MasteringGame {...commonMinigameProps} />;
      case 'effectChain': return <EffectChainGame {...commonMinigameProps} genre="rock" />;
      case 'acousticTuning': return <AcousticTreatmentGame {...commonMinigameProps} recordingType="vocal" />;
      case 'instrumentLayering': return <InstrumentLayeringGame {...commonMinigameProps} genre="pop" />;
      case 'pedalboard': return <GuitarPedalBoardGame {...commonMinigameProps} />;
      case 'patchbay': return <PatchBayGame {...commonMinigameProps} />;
      case 'microphonePlacement': return <MicrophonePlacementGame {...commonMinigameProps} />;
      case 'lyricFocus': return <LyricFocusGame {...lyricFocusProps} />;
      case 'analogConsole': return <AnalogConsoleGame {...commonMinigameProps} />;
      case 'digitalMixing': return <DigitalMixingGame {...commonMinigameProps} />;
      case 'hybridMixing': return <HybridMixingGame {...commonMinigameProps} />;
      case 'masteringChain': return <MasteringChainGame {...commonMinigameProps} />;
      case 'audioRestoration': return <AudioRestorationGame {...commonMinigameProps} />;
      case 'midiProgramming': return <MidiProgrammingGame {...commonMinigameProps} />;
      case 'sampleEditing': return <SamplingSequencingGame {...commonMinigameProps} />;
      case 'digitalDistribution': return <DigitalDistributionGame {...commonMinigameProps} />;
      case 'socialMediaPromotion': return <SocialMediaPromotionGame {...commonMinigameProps} />;
      case 'streamingOptimization': return <StreamingOptimizationGame {...commonMinigameProps} />;
      case 'aiMastering': return <AIMasteringGame {...commonMinigameProps} />;
      case 'tapeSplicing': return <TapeSplicingGame {...commonMinigameProps} />;
      case 'fourTrackRecording': return <FourTrackRecordingGame {...commonMinigameProps} />;
      
      default:
        console.warn("Unhandled gameType in MinigameManager renderGame:", gameType);
        return <div>Minigame "{gameType}" not implemented in manager.</div>;
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
