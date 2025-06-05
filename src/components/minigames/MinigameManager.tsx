
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RhythmTimingGame } from './RhythmTimingGame';
import { MixingBoardGame } from './MixingBoardGame';
import { SoundWaveGame } from './SoundWaveGame';
import { toast } from '@/hooks/use-toast';

export type MinigameType = 'rhythm' | 'mixing' | 'waveform';

interface MinigameManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward
}) => {
  const [showGame, setShowGame] = useState(true);

  const handleGameComplete = (score: number) => {
    setShowGame(false);
    
    // Calculate rewards based on score and game type
    let creativityBonus = 0;
    let technicalBonus = 0;
    let xpBonus = Math.floor(score / 10);

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
        return <MixingBoardGame {...gameProps} />;
      case 'waveform':
        return <SoundWaveGame {...gameProps} />;
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
