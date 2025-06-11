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
import GearMaintenanceGame from './GearMaintenanceGame'; // Default import
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { toast } from '@/hooks/use-toast';
// import { playSound } from '@/utils/soundUtils'; // playSound seems unused here, consider removing if not needed directly in manager

// MinigameType will also serve as minigameId for tutorial tracking
export type MinigameType = 
  | 'rhythm' 
  | 'mixing' 
  | 'waveform' 
  | 'beatmaking' 
  | 'vocal' 
  | 'mastering' 
  | 'effectchain' 
  | 'acoustic' 
  | 'layering' 
  | 'maintenance';
  // Add new minigame types here and ensure they have corresponding entries in minigameTutorials
  // | 'songwriting' // Example: if SongwritingGame becomes a distinct minigame managed here
  // | 'tapeSplicing' // Example
  // | 'midiProgramming' // Example

interface MinigameManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
  // Optional: Pass equipment details if relevant for the specific minigame (e.g., maintenance)
  equipmentContext?: { name: string }; 
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward,
  equipmentContext, // Added equipmentContext
}) => {
  const [showGame, setShowGame] = useState(true);
  const backgroundMusic = useBackgroundMusic(); // Assuming this is for BeatMakingGame or similar

  const handleGameComplete = (score: number, success?: boolean) => { // Added success parameter for maintenance game
    setShowGame(false);
    
    let creativityBonus = 0;
    let technicalBonus = 0;
    const xpBonus = Math.floor(Math.max(1, score / 50));

    // Score might be a direct value or a quality impact percentage (0-100 for maintenance)
    // For maintenance, score is qualityImpact (0-20), success is boolean
    // We need to normalize or handle this. For now, let's assume score is consistently 0-1000 range for others.
    // If gameType is maintenance, score is already small (0-20), so direct use might be okay for bonuses.

    switch (gameType) {
      case 'rhythm':
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 12);
        break;
      case 'mixing':
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'waveform': // Also known as SoundWaveGame
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
      case 'layering': // InstrumentLayeringGame
        creativityBonus = Math.floor(score / 9);
        technicalBonus = Math.floor(score / 11);
        break;
      case 'maintenance': // GearMaintenanceGame
        // For maintenance, score is already the direct quality impact (0-20)
        // And success is a boolean. We can use the score directly for small bonuses.
        // Or adjust if `score` here means the `qualityImpact` from GearMaintenanceGame
        // If `score` is the `qualityImpact` (0-20), then bonuses will be small.
        // Let's assume `score` passed to handleGameComplete from GearMaintenanceGame is its `qualityImpact`.
        creativityBonus = success ? Math.floor(score / 4) : 0; // e.g. max 5 if score is 20
        technicalBonus = success ? Math.floor(score / 2) : 0; // e.g. max 10 if score is 20
        // xpBonus is already calculated based on score, which is fine.
        break;
      // Add cases for other minigames if their reward calculation differs
      default:
        // Generic fallback or throw error
        console.warn(`Unknown game type for reward calculation: ${gameType}`);
        break;
    }

    onReward(creativityBonus, technicalBonus, xpBonus);

    toast({
      title: "Minigame Complete!",
      description: `Rewards: +${creativityBonus} C, +${technicalBonus} T, +${xpBonus} XP`,
      variant: success === false ? "destructive" : "default", // Indicate if it wasn't fully successful
    });
    // onClose(); // Call onClose after toast to ensure modal closes
  };

  const handleDialogClose = () => {
    setShowGame(true); // Reset for next time
    onClose();
  };

  const renderGame = () => {
    if (!showGame) return null;

    // Common props for all minigames
    const commonGameProps = {
      // Pass gameType as minigameId for tutorial tracking
      minigameId: gameType, 
      onClose: handleDialogClose, // Use this for closing the dialog wrapper
    };

    // Specific onComplete for games that return a single score (0-1000 typically)
    const standardOnComplete = (score: number) => handleGameComplete(score);
    // Specific onComplete for GearMaintenanceGame (returns success: boolean, score: number (0-20))
    const maintenanceOnComplete = (success: boolean, score: number) => handleGameComplete(score, success);

    switch (gameType) {
      case 'rhythm':
        return <RhythmTimingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'mixing':
        return <MixingBoardGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'waveform':
        return <SoundWaveGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'beatmaking':
        return <BeatMakingGame {...commonGameProps} onComplete={standardOnComplete} backgroundMusic={backgroundMusic} />;
      case 'vocal':
        return <VocalRecordingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'mastering':
        return <MasteringGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'effectchain':
        return <EffectChainGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'acoustic':
        return <AcousticTreatmentGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'layering':
        return <InstrumentLayeringGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'maintenance':
        if (!equipmentContext) {
          console.error('Equipment context is required for maintenance minigame.');
          return <div>Error: Equipment context missing.</div>;
        }
        return <GearMaintenanceGame {...commonGameProps} onComplete={maintenanceOnComplete} equipment={equipmentContext} />;
      default:
        console.error(`Unknown game type: ${gameType}`);
        return <div>Error: Unknown minigame type.</div>; // Fallback UI
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl bg-transparent border-0 p-0 overflow-hidden">
        {renderGame()}
      </DialogContent>
    </Dialog>
  );
};
