
import React from 'react';
import { BeatMakingGame } from './BeatMakingGame';
import { RhythmTimingGame } from './RhythmTimingGame';
import { MixingBoardGame } from './MixingBoardGame';
import { SoundWaveGame } from './SoundWaveGame';
import { VocalRecordingGame } from './VocalRecordingGame';
import { EffectChainGame } from './EffectChainGame';
import { InstrumentLayeringGame } from './InstrumentLayeringGame';
import { MasteringGame } from './MasteringGame';
import { AcousticTreatmentGame } from './AcousticTreatmentGame';
import { MidiProgrammingGame } from './MidiProgrammingGame';
import { SamplingSequencingGame } from './SamplingSequencingGame';
import { TapeSplicingGame } from './TapeSplicingGame';

export type MinigameType = 
  | 'creativity' 
  | 'beat-making' 
  | 'technical' 
  | 'rhythm' 
  | 'mixing' 
  | 'sound-wave' 
  | 'waveform'
  | 'vocal' 
  | 'effects' 
  | 'effectchain'
  | 'layering' 
  | 'mastering' 
  | 'acoustic' 
  | 'midi' 
  | 'sampling' 
  | 'tape'
  | 'beatmaking';

export interface MinigameManagerProps {
  minigameType?: string;
  type?: string;
  gameType?: MinigameType;
  isOpen?: boolean;
  onComplete?: (score: number) => void;
  onReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
  onClose: () => void;
  gameState?: any;
  focusAllocation?: any;
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  minigameType,
  type,
  gameType,
  isOpen = true,
  onComplete,
  onReward,
  onClose,
  gameState,
  focusAllocation
}) => {
  // Determine the actual minigame type from the various prop options
  const actualType = minigameType || type || gameType || 'creativity';

  const handleComplete = (score: number) => {
    if (onComplete) {
      onComplete(score);
    }
    if (onReward) {
      // Convert score to bonuses
      const creativityBonus = Math.floor(score / 20);
      const technicalBonus = Math.floor(score / 20);
      const xpBonus = Math.floor(score / 10);
      onReward(creativityBonus, technicalBonus, xpBonus);
    }
  };

  const renderMinigame = () => {
    switch (actualType) {
      case 'creativity':
      case 'beat-making':
      case 'beatmaking':
        return <BeatMakingGame onComplete={handleComplete} onClose={onClose} />;
      case 'technical':
      case 'rhythm':
        return <RhythmTimingGame onComplete={handleComplete} onClose={onClose} />;
      case 'mixing':
        return <MixingBoardGame onComplete={handleComplete} onClose={onClose} />;
      case 'sound-wave':
      case 'waveform':
        return <SoundWaveGame onComplete={handleComplete} onClose={onClose} />;
      case 'vocal':
        return <VocalRecordingGame onComplete={handleComplete} onClose={onClose} />;
      case 'effects':
      case 'effectchain':
        return <EffectChainGame onComplete={handleComplete} onClose={onClose} />;
      case 'layering':
        return <InstrumentLayeringGame onComplete={handleComplete} onClose={onClose} />;
      case 'mastering':
        return <MasteringGame onComplete={handleComplete} onClose={onClose} />;
      case 'acoustic':
        return <AcousticTreatmentGame onComplete={handleComplete} onClose={onClose} />;
      case 'midi':
        return <MidiProgrammingGame onComplete={handleComplete} onClose={onClose} />;
      case 'sampling':
        return <SamplingSequencingGame onComplete={handleComplete} onClose={onClose} />;
      case 'tape':
        return <TapeSplicingGame onComplete={handleComplete} onClose={onClose} />;
      default:
        return <BeatMakingGame onComplete={handleComplete} onClose={onClose} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        {renderMinigame()}
      </div>
    </div>
  );
};
