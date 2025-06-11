import { useEffect, useState } from 'react';
// import { gameAudio } from '@/utils/audioSystem'; // gameAudio is not directly used by BGM HTMLAudioElement
import { useSettings } from '@/contexts/SettingsContext';
import { userHasInteracted } from '../utils/userInteraction'; // Import user interaction utility

interface BackgroundMusicManager {
  currentTrack: number;
  isPlaying: boolean;
  playTrack: (trackNumber: number) => void;
  nextTrack: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  fadeVolume: (targetVolume: number, duration?: number) => Promise<void>;
  restoreVolume: (duration?: number) => Promise<void>;
}

// Global singleton state for background music
let globalAudioRef: HTMLAudioElement | null = null;
let globalFadeIntervalRef: NodeJS.Timeout | null = null;
let globalCurrentTrack = 1;
let globalIsPlaying = false;
let globalOriginalVolume = 0.5;
// let globalPendingPlayDueToNoInteraction = false; // Flag to indicate if play was deferred

export const useBackgroundMusic = (): BackgroundMusicManager => {
  const [currentTrack, setCurrentTrack] = useState(globalCurrentTrack);
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const [hasInteractedState, setHasInteractedState] = useState(userHasInteracted());
  const { settings } = useSettings();
  const trackCount = 8; // We have 8 BGM tracks

  // Effect to listen for the custom 'userInteracted' event and update local state
  useEffect(() => {
    const handleUserInteractionEvent = () => {
      console.log('BGM: "userInteracted" event received by hook.');
      if (!hasInteractedState) { // Only update if state is not yet true
        setHasInteractedState(true);
      }
    };

    // If interaction hasn't happened yet according to global util, listen for the event.
    // If it has happened globally but local state is stale, update local state.
    if (!userHasInteracted()) {
      document.addEventListener('userInteracted', handleUserInteractionEvent);
      console.log('BGM: Added "userInteracted" event listener.');
    } else if (!hasInteractedState) {
      console.log('BGM: User already interacted globally, syncing local state.');
      setHasInteractedState(true); // Sync local state if global interaction already occurred
    }

    return () => {
      document.removeEventListener('userInteracted', handleUserInteractionEvent);
      console.log('BGM: Removed "userInteracted" event listener.');
    };
  }, [hasInteractedState]); // Re-run if local hasInteractedState changes, to remove listener once true

  useEffect(() => {
    // Initialize audio element only once globally
    if (!globalAudioRef) {
      globalAudioRef = new Audio();
      globalAudioRef.loop = false;
      globalAudioRef.volume = settings.musicVolume;
      globalOriginalVolume = settings.musicVolume;

      // Auto-advance to next track when current one ends
      globalAudioRef.addEventListener('ended', () => {
        nextTrack();
      });
    }

    return () => {
      // Only cleanup when all components using this hook are unmounted
      // This prevents premature cleanup when switching between components
    };
  }, []);

  // Update volume when settings change
  useEffect(() => {
    if (globalAudioRef) {
      const newVolume = settings.musicEnabled ? settings.musicVolume : 0;
      globalAudioRef.volume = newVolume;
      globalOriginalVolume = settings.musicVolume; // Store the original volume
    }
  }, [settings.musicVolume, settings.musicEnabled]);

  const fadeVolume = async (targetVolume: number, duration: number = 1000): Promise<void> => {
    return new Promise((resolve) => {
      if (!globalAudioRef || !settings.musicEnabled) {
        resolve();
        return;
      }

      const startVolume = globalAudioRef.volume;
      const volumeDiff = targetVolume - startVolume;
      const steps = 50; // Number of fade steps
      const stepDuration = duration / steps;
      const volumeStep = volumeDiff / steps;
      let currentStep = 0;

      // Clear any existing fade
      if (globalFadeIntervalRef) {
        clearInterval(globalFadeIntervalRef);
      }

      globalFadeIntervalRef = setInterval(() => {
        if (!globalAudioRef) {
          resolve();
          return;
        }

        currentStep++;
        const newVolume = startVolume + (volumeStep * currentStep);
        
        if (currentStep >= steps) {
          globalAudioRef.volume = targetVolume;
          if (globalFadeIntervalRef) {
            clearInterval(globalFadeIntervalRef);
            globalFadeIntervalRef = null;
          }
          resolve();
        } else {
          globalAudioRef.volume = Math.max(0, Math.min(1, newVolume));
        }
      }, stepDuration);
    });
  };

  const restoreVolume = async (duration: number = 1000): Promise<void> => {
    const targetVolume = settings.musicEnabled ? globalOriginalVolume : 0;
    return fadeVolume(targetVolume, duration);
  };

  const playTrack = async (trackNumber: number) => {
    if (!globalAudioRef || !settings.musicEnabled) {
      // globalPendingPlayDueToNoInteraction = settings.musicEnabled; // Remember intent if disabled only by no interaction
      return;
    }

    if (!hasInteractedState) {
      console.log(`BGM: Play for track ${trackNumber} deferred, user has not interacted.`);
      // globalPendingPlayDueToNoInteraction = true;
      return; // Don't try to play if no interaction
    }
    // globalPendingPlayDueToNoInteraction = false; // Clear flag if we proceed

    try {
      const currentSrcBase = globalAudioRef.src.substring(globalAudioRef.src.lastIndexOf('/') + 1);
      const newSrcBase = `tycoon-bgm${trackNumber}.mp3`;

      // Only reload and play if the track is different or if it's not playing
      if (currentSrcBase !== newSrcBase || globalAudioRef.paused) {
        console.log(`BGM: Loading and playing track ${trackNumber}`);
        globalAudioRef.src = `/audio/music/tycoon-bgm${trackNumber}.mp3`;
        globalAudioRef.currentTime = 0; // Reset time for new track or replay
        await globalAudioRef.play();
        globalCurrentTrack = trackNumber;
        globalIsPlaying = true;
        setCurrentTrack(trackNumber);
        setIsPlaying(true);
        console.log(`Playing BGM track ${trackNumber}`);
      } else if (!globalAudioRef.paused && currentSrcBase === newSrcBase) {
        console.log(`BGM: Track ${trackNumber} is already playing.`);
      }
    } catch (error) {
      console.warn(`Failed to play BGM track ${trackNumber}:`, error);
      globalIsPlaying = false; // Ensure state reflects failure
      setIsPlaying(false);
    }
  };

  const nextTrack = () => {
    const next = globalCurrentTrack >= trackCount ? 1 : globalCurrentTrack + 1;
    playTrack(next);
  };

  const pauseMusic = () => {
    if (globalAudioRef && globalIsPlaying) {
      globalAudioRef.pause();
      globalIsPlaying = false;
      setIsPlaying(false);
    }
  };

  const resumeMusic = () => {
    if (globalAudioRef && !globalIsPlaying && settings.musicEnabled) {
      if (!hasInteractedState) {
        console.log('BGM: Resume deferred, user has not interacted.');
        // globalPendingPlayDueToNoInteraction = true;
        return; // Don't try to play if no interaction
      }
      // globalPendingPlayDueToNoInteraction = false;
      globalAudioRef.play().then(() => {
        globalIsPlaying = true;
        setIsPlaying(true);
        console.log('BGM: Music resumed.');
      }).catch(error => {
        console.warn('Failed to resume music:', error);
      });
    }
  };

  // Main effect to handle playing/pausing music based on settings and interaction state
  useEffect(() => {
    if (settings.musicEnabled && hasInteractedState) {
      if (!globalIsPlaying && globalAudioRef) {
        console.log('BGM: Main Play/Pause Effect - Attempting to play track.', { track: globalCurrentTrack, musicEnabled: settings.musicEnabled, hasInteracted: hasInteractedState, isPlaying: globalIsPlaying });
        playTrack(globalCurrentTrack);
      } else {
        console.log('BGM: Main Play/Pause Effect - Conditions not met for playing or already playing.', { musicEnabled: settings.musicEnabled, hasInteracted: hasInteractedState, isPlaying: globalIsPlaying });
      }
    } else { // Music is disabled OR user hasn't interacted
      if (globalIsPlaying && globalAudioRef) {
        console.log('BGM: Main Play/Pause Effect - Attempting to pause music.', { musicEnabled: settings.musicEnabled, hasInteracted: hasInteractedState, isPlaying: globalIsPlaying });
        pauseMusic();
      } else {
         console.log('BGM: Main Play/Pause Effect - Conditions not met for pausing or already paused.', { musicEnabled: settings.musicEnabled, hasInteracted: hasInteractedState, isPlaying: globalIsPlaying });
      }
    }
  }, [settings.musicEnabled, hasInteractedState, globalIsPlaying]); // globalIsPlaying ensures this re-evaluates if an attempt to play fails and sets isPlaying to false

  // Note: The previous "mount effect" is now covered by the main play/pause effect above,
  // as it also depends on hasInteractedState.

  return {
    currentTrack,
    isPlaying,
    playTrack,
    nextTrack,
    pauseMusic,
    resumeMusic,
    fadeVolume,
    restoreVolume
  };
};
