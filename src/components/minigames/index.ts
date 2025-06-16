// MinigameTutorialPopup seems to be missing, so it remains commented.
// import { MinigameTutorialPopup } from './MinigameTutorialPopup'; 

export interface MinigameTutorialContent {
  title: string;
  instructions: { icon: string; text: string }[];
}

// This tutorial data structure seems fine.
export const minigameTutorials: Record<string, MinigameTutorialContent> = {
  beatMaking: {
    title: "Beat Making Basics 🥁",
    instructions: [
      { icon: '👆', text: 'Tap the pads to place drum sounds on the sequencer grid.' },
      { icon: '🎶', text: 'Create a cool rhythm that matches the target genre.' },
      { icon: '✅', text: 'Fill the meter by creating a high-quality beat within the time limit!' },
    ],
  },
  // ... (other existing tutorial entries would be here) ...
  tapeSplicing: {
    title: "Tape Splicing ✂️",
    instructions: [
      { icon: '🎞️', text: 'Drag and drop tape segments onto the timeline.' },
      { icon: '🧩', text: 'Arrange the segments in the correct order to reconstruct the audio.' },
      { icon: '🎧', text: 'Listen to the preview and make adjustments until it sounds right!' },
    ],
  },
  mixingBoard: {
    title: "Mixing Magic 🎚️",
    instructions: [
      { icon: '🔊', text: 'Adjust the faders for each track to achieve a balanced mix.' },
      { icon: '⚖️', text: 'Keep an eye on the master level to avoid clipping (going into red).' },
      { icon: '🌟', text: 'Match the target levels for each instrument group for the best score.' },
    ],
  },
  mastering: {
    title: "Mastering Suite ✨",
    instructions: [
      { icon: '📊', text: 'Use EQ, compression, and limiter tools to polish the final track.' },
      { icon: '👂', text: 'Listen carefully to make the track loud, clear, and punchy.' },
      { icon: '🏆', text: 'Meet the target loudness and dynamic range for a professional master.' },
    ],
  },
  lyricFocus: {
    title: "Lyric Focus ✍️",
    instructions: [
      { icon: '🎯', text: 'A theme, genre, and mood will be presented for your song.' },
      { icon: '🤔', text: 'Select keywords/phrases from the pool that best match the lyrical direction.' },
      { icon: '⏱️', text: 'Choose up to 7 items within the time limit to maximize your Lyrical Focus score!' },
      { icon: '🌟', text: 'Higher scores improve your song\'s lyrical quality.' },
    ],
  },
};

// export { MinigameTutorialPopup }; // Still commented as file likely missing

// Core Recording Minigames
export { VocalRecordingGame } from './VocalRecordingGame';
export { MicrophonePlacementGame } from './MicrophonePlacementGame';
export { FourTrackRecordingGame } from './FourTrackRecordingGame';
export { TapeSplicingGame } from './TapeSplicingGame';

// Mixing & Production Minigames
export { MixingBoardGame } from './MixingBoardGame';
export { AnalogConsoleGame } from './AnalogConsoleGame';
export { DigitalMixingGame } from './DigitalMixingGame';
export { HybridMixingGame } from './HybridMixingGame';
export { EffectChainGame } from './EffectChainGame';
export { GuitarPedalBoardGame } from './GuitarPedalBoardGame';
export { PatchBayGame } from './PatchBayGame';

// Mastering & Processing Minigames
export { MasteringGame } from './MasteringGame';
export { MasteringChainGame } from './MasteringChainGame';
export { AudioRestorationGame } from './AudioRestorationGame'; // File exists, uncommenting
export { AcousticTreatmentGame } from './AcousticTreatmentGame';

// Creative & Technical Minigames
export { RhythmTimingGame } from './RhythmTimingGame';
export { BeatMakingGame } from './BeatMakingGame';
export { SoundWaveGame } from './SoundWaveGame';
// export { SoundDesignGame } from './SoundDesignGame'; // Assuming still missing
// export { SoundDesignSynthesisGame } from './SoundDesignSynthesisGame'; // Assuming still missing
export { MidiProgrammingGame } from './MidiProgrammingGame';
export { SamplingSequencingGame } from './SamplingSequencingGame';
export { InstrumentLayeringGame } from './InstrumentLayeringGame';

// Modern Era Minigames
export { DigitalDistributionGame } from './DigitalDistributionGame';
export { SocialMediaPromotionGame } from './SocialMediaPromotionGame';
export { StreamingOptimizationGame } from './StreamingOptimizationGame';
export { AIMasteringGame } from './AIMasteringGame';

// Minigame Manager
export { MinigameManager } from './MinigameManager';

// Newly added minigame
export { LyricFocusGame } from './LyricFocusGame';
