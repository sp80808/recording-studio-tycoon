import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RhythmTimingGame } from './RhythmTimingGame';
import { MixingBoardGame } from './MixingBoardGame';
import { SoundWaveGame } from './SoundWaveGame';
import { BeatMakingGame } from './BeatMakingGame';
import { VocalRecordingGame } from './VocalRecordingGame';
import { MasteringGame } from './MasteringGame';
import { EffectChainGame } from './EffectChainGame';
import { AcousticTreatmentGame } from './AcousticTreatmentGame';
import { InstrumentLayeringGame } from './InstrumentLayeringGame';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { toast } from '@/hooks/use-toast';
import { MixingMinigame } from './MixingMinigame';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { gameAudio } from '@/utils/audioSystem';
import { VocalRecordingMinigame } from './VocalRecordingMinigame';
import { GuitarPedalBoardGame } from './GuitarPedalBoardGame';
import { PatchBayGame } from './PatchBayGame';

export type MinigameType = 'rhythm' | 'mixing' | 'waveform' | 'beatmaking' | 'vocal' | 'mastering' | 'effectchain' | 'acoustic' | 'layering' | 'recording' | 'pedalboard' | 'patchbay';

interface MinigameManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
  onComplete: (type: MinigameType, score: number) => void;
  difficulty: number;
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward,
  onComplete,
  difficulty
}) => {
  const [showGame, setShowGame] = useState(true);
  const backgroundMusic = useBackgroundMusic();

  const handleGameComplete = (score: number) => {
    setShowGame(false);
    
    // Calculate rewards based on score and game type
    let creativityBonus = 0;
    let technicalBonus = 0;
    // Dramatically reduced XP scaling to prevent exponential progression
    const xpBonus = Math.floor(Math.max(1, score / 50)); // Reduced from /10 to /50

    switch (gameType) {
      case 'rhythm':
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 12);
        break;
      case 'mixing':
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'waveform':
        creativityBonus = Math.floor(score / 10);
        technicalBonus = Math.floor(score / 10);
        break;
      case 'beatmaking':
        creativityBonus = Math.floor(score / 6);
        technicalBonus = Math.floor(score / 15);
        break;
      case 'vocal':
        creativityBonus = Math.floor(score / 7);
        technicalBonus = Math.floor(score / 11);
        break;
      case 'mastering':
        creativityBonus = Math.floor(score / 15);
        technicalBonus = Math.floor(score / 6);
        break;
      case 'effectchain':
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 10);
        break;
      case 'acoustic':
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'layering':
        creativityBonus = Math.floor(score / 9);
        technicalBonus = Math.floor(score / 11);
        break;
    }

    onReward(creativityBonus, technicalBonus, xpBonus);

    toast({
      title: "Minigame Complete!",
      description: `Earned +${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
    });
  };

  const handleClose = () => {
    setShowGame(true);
    onClose();
  };

  const handleMinigameComplete = (score: number) => {
    setShowGame(false);
    onComplete(gameType, score);
  };

  const renderGame = () => {
    if (!showGame) return null;

    const gameProps = {
      onComplete: handleGameComplete,
      onClose: handleClose
    };

    switch (gameType) {
      case 'rhythm':
        return <RhythmTimingGame {...gameProps} />;
      case 'mixing':
        return <MixingMinigame
          onComplete={handleMinigameComplete}
          onClose={handleClose}
          difficulty={difficulty}
        />;
      case 'waveform':
        return <SoundWaveGame {...gameProps} />;
      case 'beatmaking':
        return <BeatMakingGame {...gameProps} backgroundMusic={backgroundMusic} />;
      case 'vocal':
        return <VocalRecordingMinigame
          onComplete={handleMinigameComplete}
          onClose={handleClose}
          difficulty={difficulty}
        />;
      case 'mastering':
        return <MasteringGame {...gameProps} />;
      case 'effectchain':
        return <EffectChainGame {...gameProps} />;
      case 'acoustic':
        return <AcousticTreatmentGame {...gameProps} />;
      case 'layering':
        return <InstrumentLayeringGame {...gameProps} />;
      case 'pedalboard':
        return (
          <GuitarPedalBoardGame
            onComplete={handleMinigameComplete}
            onClose={handleClose}
            difficulty={difficulty}
          />
        );
      case 'patchbay':
        return (
          <PatchBayGame
            onComplete={handleMinigameComplete}
            onClose={handleClose}
            difficulty={difficulty}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-transparent border-0 p-0">
        {renderGame()}
      </DialogContent>
    </Dialog>
  );
};
