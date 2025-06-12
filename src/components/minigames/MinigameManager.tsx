import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RhythmTimingGame } from './RhythmTimingGame';
import { SoundWaveGame } from './SoundWaveGame';
import { BeatMakingGame } from './BeatMakingGame';
import { MasteringGame } from './MasteringGame';
import { EffectChainGame } from './EffectChainGame';
import { AcousticTreatmentGame } from './AcousticTreatmentGame';
import { InstrumentLayeringGame } from './InstrumentLayeringGame';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { toast } from '@/hooks/use-toast';
import { MixingMinigame } from './MixingMinigame';
import { VocalRecordingMinigame } from './VocalRecordingMinigame';
import { GuitarPedalBoardGame } from './GuitarPedalBoardGame';
import { PatchBayGame } from './PatchBayGame';
import { MinigameType } from '@/types/miniGame'; // Import canonical MinigameType


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
      case 'rhythm_timing': // Updated to match MinigameType from types/miniGame.ts
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 12);
        break;
      case 'mixing_board': // Updated
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'sound_wave': // Updated
        creativityBonus = Math.floor(score / 10);
        technicalBonus = Math.floor(score / 10);
        break;
      case 'beat_making': // Updated
        creativityBonus = Math.floor(score / 6);
        technicalBonus = Math.floor(score / 15);
        break;
      case 'vocal_recording': // Updated
        creativityBonus = Math.floor(score / 7);
        technicalBonus = Math.floor(score / 11);
        break;
      case 'mastering':
        creativityBonus = Math.floor(score / 15);
        technicalBonus = Math.floor(score / 6);
        break;
      case 'effect_chain':
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 10);
        break;
      case 'acoustic_tuning': // Updated
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'layering': // This type doesn't exist in types/miniGame.ts, but keeping for now if it's used elsewhere
        creativityBonus = Math.floor(score / 9);
        technicalBonus = Math.floor(score / 11);
        break;
      case 'microphone_placement':
        creativityBonus = Math.floor(score / 10);
        technicalBonus = Math.floor(score / 7);
        break;
      case 'mastering_chain':
        creativityBonus = Math.floor(score / 15);
        technicalBonus = Math.floor(score / 5);
        break;
      case 'sound_design_synthesis':
        creativityBonus = Math.floor(score / 5);
        technicalBonus = Math.floor(score / 15);
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
      case 'rhythm_timing':
        return <RhythmTimingGame {...gameProps} />;
      case 'mixing_board':
        return <MixingMinigame
          onComplete={handleMinigameComplete}
          onClose={handleClose}
          difficulty={difficulty}
        />;
      case 'sound_wave':
        return <SoundWaveGame {...gameProps} />;
      case 'beat_making':
        return <BeatMakingGame {...gameProps} backgroundMusic={backgroundMusic} />;
      case 'vocal_recording':
        return <VocalRecordingMinigame
          onComplete={handleMinigameComplete}
          onClose={handleClose}
          difficulty={difficulty}
        />;
      case 'mastering':
        return <MasteringGame {...gameProps} />;
      case 'effect_chain':
        return <EffectChainGame {...gameProps} />;
      case 'acoustic_tuning':
        return <AcousticTreatmentGame {...gameProps} />;
      case 'layering': // This type doesn't exist in types/miniGame.ts, but keeping for now if it's used elsewhere
        return <InstrumentLayeringGame {...gameProps} />;
      case 'pedalboard': // Assuming 'pedalboard' is a valid MinigameType from types/miniGame.ts
        return (
          <GuitarPedalBoardGame
            onComplete={handleMinigameComplete}
            onClose={handleClose}
            difficulty={difficulty}
          />
        );
      case 'patchbay': // Assuming 'patchbay' is a valid MinigameType from types/miniGame.ts
        return (
          <PatchBayGame
            onComplete={handleMinigameComplete}
            onClose={handleClose}
            difficulty={difficulty}
          />
        );
      case 'microphone_placement':
        return <AcousticTreatmentGame {...gameProps} />; // Removed difficulty prop
      // Removed mastering_chain and sound_design_synthesis cases as components are not found
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
