// import { MinigameTutorialPopup } from './MinigameTutorialPopup'; // File does not exist

export interface MinigameTutorialContent {
  title: string;
  instructions: { icon: string; text: string }[];
}

export const minigameTutorials: Record<string, MinigameTutorialContent> = {
  beatMaking: {
    title: "Beat Making Basics 🥁",
    instructions: [
      { icon: '👆', text: 'Tap the pads to place drum sounds on the sequencer grid.' },
      { icon: '🎶', text: 'Create a cool rhythm that matches the target genre.' },
      { icon: '✅', text: 'Fill the meter by creating a high-quality beat within the time limit!' },
    ],
  },
  gearMaintenance: {
    title: "Gear Tune-Up Time 🔧",
    instructions: [
      { icon: '⚙️', text: 'Adjust the dials to match the hidden target values.' },
      { icon: '↔️', text: 'Use the buttons to increase or decrease each dial\'s setting.' },
      { icon: '🎯', text: 'Get all dials within the green zone for a perfect calibration. You have limited attempts!' },
    ],
  },
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
  // Add more minigames here as they are developed
  // Example for a new minigame:
  // soundWaveGame: {
  //   title: "Sound Wave Surfer 🌊",
  //   instructions: [
  //     { icon: '✏️', text: 'Draw a waveform that matches the target shape shown on screen.' },
  //     { icon: '〰️', text: 'The closer your drawing, the higher your score!' },
  //     { icon: '⚡️', text: 'Complete multiple waves before time runs out.' },
  //   ],
  // },
};

// export { MinigameTutorialPopup }; // File does not exist

// Core Recording Minigames
export { VocalRecordingGame } from './VocalRecordingGame'; // Exists
export { MicrophonePlacementGame } from './MicrophonePlacementGame';
export { FourTrackRecordingGame } from './FourTrackRecordingGame'; // Exists
export { TapeSplicingGame } from './TapeSplicingGame'; // Exists

// Mixing & Production Minigames
export { MixingBoardGame } from './MixingBoardGame'; // Exists
export { AnalogConsoleGame } from './AnalogConsoleGame'; // Exists
export { DigitalMixingGame } from './DigitalMixingGame'; // File exists
export { HybridMixingGame } from './HybridMixingGame'; // File exists
export { EffectChainGame } from './EffectChainGame'; // Exists
export { GuitarPedalBoardGame } from './GuitarPedalBoardGame'; // Exists
export { PatchBayGame } from './PatchBayGame'; // Exists

// Mastering & Processing Minigames
export { MasteringGame } from './MasteringGame'; // Exists
export { MasteringChainGame } from './MasteringChainGame'; // File exists
// export { AudioRestorationGame } from './AudioRestorationGame'; // File does not exist
export { AcousticTreatmentGame } from './AcousticTreatmentGame'; // Exists

// Creative & Technical Minigames
export { RhythmTimingGame } from './RhythmTimingGame'; // Exists
export { BeatMakingGame } from './BeatMakingGame'; // Exists
export { SoundWaveGame } from './SoundWaveGame'; // Exists
// export { SoundDesignGame } from './SoundDesignGame'; // File does not exist
// export { SoundDesignSynthesisGame } from './SoundDesignSynthesisGame'; // File does not exist
export { MidiProgrammingGame } from './MidiProgrammingGame'; // Exists
export { SamplingSequencingGame } from './SamplingSequencingGame'; // Exists
export { InstrumentLayeringGame } from './InstrumentLayeringGame'; // Exists

// Modern Era Minigames
export { DigitalDistributionGame } from './DigitalDistributionGame';
export { SocialMediaPromotionGame } from './SocialMediaPromotionGame';
export { StreamingOptimizationGame } from './StreamingOptimizationGame';
export { AIMasteringGame } from './AIMasteringGame';

// Minigame Manager
export { MinigameManager } from './MinigameManager';
