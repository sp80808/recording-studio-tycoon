import React, { useEffect, useState } from 'react';
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
import { VocalTuningGame } from './VocalTuningGame';
import { LiveRecordingGame } from './LiveRecordingGame'; // Import new game
import GearMaintenanceGame from './GearMaintenanceGame'; // Default import
import { EQMatchGame } from './EQMatchGame';
import { FaderRideGame } from './FaderRideGame';
import { PunchInGame } from './PunchInGame';
import { BeatPadGame } from './BeatPadGame';
import { TapeJogGame } from './TapeJogGame';
import { ConsoleRideGame } from './ConsoleRideGame';
import { VocalCompGame } from './VocalCompGame';
import { AlbumSequenceGame } from './AlbumSequenceGame';
import { LyricFocusGame } from './LyricFocusGame';
import { TapeSplicingGame } from './TapeSplicingGame';
import { SamplingSequencingGame } from './SamplingSequencingGame';
import { FaultHuntGame } from './FaultHuntGame';
import { ChainRecallGame } from './ChainRecallGame';
import { SessionScrambleGame } from './SessionScrambleGame';
import { FlightCasePackingGame } from './FlightCasePackingGame';
import { BusMergeGame } from './BusMergeGame';
import { PhaseCheckGame } from './PhaseCheckGame';
import { GainStagingGame } from './GainStagingGame';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { toast } from '@/hooks/use-toast';
import { useCutsceneQueue } from '@/hooks/useCutsceneQueue';
import { tc } from '@/i18n/content';
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
  | 'maintenance'
  | 'vocal-tuning'
  | 'live-recording'
  | 'eq-match'
  | 'fader-ride'
  | 'punch-in'
  | 'beat-pad'
  | 'tape-jog'
  | 'console-ride' // Added controller-first pad minigames
  | 'vocal-comp'
  | 'album-sequence'
  | 'lyric-focus'
  | 'tape-splicing'
  | 'sampling'
  | 'fault-hunt'
  | 'chain-recall'
  | 'session-scramble'
  | 'flight-case'
  | 'bus-merge'
  | 'phase-check'
  | 'gain-stage';

interface MinigameManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: MinigameType, rawScore?: number) => void;
  // Optional: Pass equipment details if relevant for the specific minigame (e.g., maintenance)
  equipmentContext?: { name: string };
  /** When 'practice', skip project C/T toast framing — craft skill XP is applied by the caller. */
  rewardMode?: 'project' | 'practice';
}

export const MinigameManager: React.FC<MinigameManagerProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward,
  equipmentContext, // Added equipmentContext
  rewardMode = 'project',
}) => {
  const [showGame, setShowGame] = useState(true);
  const backgroundMusic = useBackgroundMusic(); // Assuming this is for BeatMakingGame or similar
  const enqueueCutscene = useCutsceneQueue((s) => s.enqueue);

  useEffect(() => {
    if (isOpen) {
      setShowGame(true);
    }
  }, [isOpen]);

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
      case 'vocal-tuning':
        creativityBonus = Math.floor(score / 14);
        technicalBonus = Math.floor(score / 7);
        break;
      case 'live-recording':
        creativityBonus = Math.floor(score / 10);
        technicalBonus = Math.floor(score / 9);
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
      case 'eq-match':
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'fader-ride':
        creativityBonus = Math.floor(score / 15);
        technicalBonus = Math.floor(score / 6);
        break;
      case 'punch-in':
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 12);
        break;
      case 'beat-pad':
        creativityBonus = Math.floor(score / 6);
        technicalBonus = Math.floor(score / 12);
        break;
      case 'tape-jog':
        creativityBonus = Math.floor(score / 15);
        technicalBonus = Math.floor(score / 6);
        break;
      case 'console-ride':
        creativityBonus = Math.floor(score / 10);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'album-sequence':
        creativityBonus = Math.floor(score / 9);
        technicalBonus = Math.floor(score / 12);
        break;
      case 'vocal-comp':
        creativityBonus = Math.floor(score / 8);
        technicalBonus = Math.floor(score / 10);
        break;
      case 'lyric-focus':
        creativityBonus = Math.floor(score / 6);
        technicalBonus = Math.floor(score / 14);
        break;
      case 'tape-splicing':
        creativityBonus = Math.floor(score / 14);
        technicalBonus = Math.floor(score / 7);
        break;
      case 'sampling':
        creativityBonus = Math.floor(score / 7);
        technicalBonus = Math.floor(score / 11);
        break;
      case 'fault-hunt':
        creativityBonus = Math.floor(score / 16);
        technicalBonus = Math.floor(score / 7);
        break;
      case 'chain-recall':
        creativityBonus = Math.floor(score / 12);
        technicalBonus = Math.floor(score / 9);
        break;
      case 'session-scramble':
      case 'flight-case':
        creativityBonus = Math.floor(score / 16);
        technicalBonus = Math.floor(score / 8);
        break;
      case 'gain-stage':
        creativityBonus = Math.floor(score / 20);
        technicalBonus = Math.floor(score / 7);
        break;
      case 'phase-check':
        creativityBonus = Math.floor(score / 18);
        technicalBonus = Math.floor(score / 7);
        break;
      case 'bus-merge':
        creativityBonus = Math.floor(score / 14);
        technicalBonus = Math.floor(score / 8);
        break;
      // Add cases for other minigames if their reward calculation differs
      default:
        // Generic fallback or throw error
        console.warn(`Unknown game type for reward calculation: ${gameType}`);
        break;
    }

    onReward(creativityBonus, technicalBonus, xpBonus, gameType, score);

    if (rewardMode === 'practice') {
      toast({
        title: tc('mg.MinigameManager.practice_take_in', '🎧 Practice take in'),
        description: score >= 700
          ? tc('mg.MinigameManager.practice_strong', 'Strong run — reviewing the tape for craft XP.')
          : score >= 400
            ? tc('mg.MinigameManager.practice_ok', 'Serviceable take. Room to tighten the next pass.')
            : tc('mg.MinigameManager.practice_rough', 'Rough pass. Little craft XP this time.'),
        className: 'bg-stone-800 border-stone-600 text-white',
        variant: success === false ? 'destructive' : 'default',
      });
      return;
    }

    // If it's an S-Rank or Botched take, show full-screen cutscene instead of toast
    if (score >= 850 || score <= 300) {
      enqueueCutscene({
        id: `outcome-${Date.now()}`,
        type: 'outcome_vignette',
        payload: { score, gameType }
      });
    } else {
      toast({
        title: tc('mg.MinigameManager.complete_title', '🎮 Minigame Complete!'),
        description: tc('mg.MinigameManager.rewards', 'Rewards: +{{c}} C, +{{t}} T, +{{xp}} XP', { c: creativityBonus, t: technicalBonus, xp: xpBonus }),
        className: "bg-stone-800 border-stone-600 text-white",
        variant: success === false ? "destructive" : "default", // Indicate if it wasn't fully successful
      });
    }
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
      case 'vocal-tuning':
        return <VocalTuningGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'live-recording':
        return <LiveRecordingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'eq-match':
        return <EQMatchGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'fader-ride':
        return <FaderRideGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'punch-in':
        return <PunchInGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'beat-pad':
        return <BeatPadGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'tape-jog':
        return <TapeJogGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'console-ride':
        return <ConsoleRideGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'album-sequence':
        return <AlbumSequenceGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'vocal-comp':
        return <VocalCompGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'lyric-focus':
        return (
          <LyricFocusGame
            {...commonGameProps}
            genre="pop"
            difficulty={4}
            onComplete={(score) => handleGameComplete(score)}
          />
        );
      case 'tape-splicing':
        return <TapeSplicingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'sampling':
        return <SamplingSequencingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'fault-hunt':
        return <FaultHuntGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'chain-recall':
        return <ChainRecallGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'session-scramble':
        return <SessionScrambleGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'flight-case':
        return <FlightCasePackingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'gain-stage':
        return <GainStagingGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'phase-check':
        return <PhaseCheckGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'bus-merge':
        return <BusMergeGame {...commonGameProps} onComplete={standardOnComplete} />;
      case 'maintenance':
        if (!equipmentContext) {
          console.error('Equipment context is required for maintenance minigame.');
          return <div>{tc('mg.MinigameManager.error_equipment', 'Error: Equipment context missing.')}</div>;
        }
        return <GearMaintenanceGame {...commonGameProps} onComplete={maintenanceOnComplete} equipment={equipmentContext} />;
      default:
        console.error(`Unknown game type: ${gameType}`);
        return <div>{tc('mg.MinigameManager.error_unknown', 'Error: Unknown minigame type.')}</div>; // Fallback UI
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl bg-transparent border-0 p-0 overflow-hidden">
        {isOpen ? renderGame() : null}
      </DialogContent>
    </Dialog>
  );
};
