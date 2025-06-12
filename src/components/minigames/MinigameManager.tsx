
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

export interface MinigameManagerProps {
  minigameType: string;
  onComplete: (score: number) => void;
  onClose: () => void;
  gameState: any;
  focusAllocation: any;
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  minigameType,
  onComplete,
  onClose,
  gameState,
  focusAllocation
}) => {
  const renderMinigame = () => {
    switch (minigameType) {
      case 'creativity':
      case 'beat-making':
        return <BeatMakingGame onComplete={onComplete} onClose={onClose} />;
      case 'technical':
      case 'rhythm':
        return <RhythmTimingGame onComplete={onComplete} onClose={onClose} />;
      case 'mixing':
        return <MixingBoardGame onComplete={onComplete} onClose={onClose} />;
      case 'sound-wave':
        return <SoundWaveGame onComplete={onComplete} onClose={onClose} />;
      case 'vocal':
        return <VocalRecordingGame onComplete={onComplete} onClose={onClose} />;
      case 'effects':
        return <EffectChainGame onComplete={onComplete} onClose={onClose} />;
      case 'layering':
        return <InstrumentLayeringGame onComplete={onComplete} onClose={onClose} />;
      case 'mastering':
        return <MasteringGame onComplete={onComplete} onClose={onClose} />;
      case 'acoustic':
        return <AcousticTreatmentGame onComplete={onComplete} onClose={onClose} />;
      case 'midi':
        return <MidiProgrammingGame onComplete={onComplete} onClose={onClose} />;
      case 'sampling':
        return <SamplingSequencingGame onComplete={onComplete} onClose={onClose} />;
      case 'tape':
        return <TapeSplicingGame onComplete={onComplete} onClose={onClose} />;
      default:
        return <BeatMakingGame onComplete={onComplete} onClose={onClose} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        {renderMinigame()}
      </div>
    </div>
  );
};
