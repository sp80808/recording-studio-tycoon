import { useEffect, useRef, useState, useCallback } from 'react';
import { gameAudio } from '@/utils/audioSystem';
import { useSettings } from '@/contexts/SettingsContext';

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

export const useBackgroundMusic = (): BackgroundMusicManager => {
  const [currentTrack, setCurrentTrack] = useState(globalCurrentTrack);
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const { settings } = useSettings();
  const trackCount = 8; // We have 8 BGM tracks

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.musicVolume]); // Added settings.musicVolume

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

  const playTrack = useCallback(async (trackNumber: number) => {
    if (!globalAudioRef || !settings.musicEnabled) return;

    try {
      // Stop current track
      globalAudioRef.pause();
      globalAudioRef.currentTime = 0;

      // Load new track
      globalAudioRef.src = `/src/audio/music/tycoon-bgm${trackNumber}.mp3`;
      
      await globalAudioRef.play();
      globalCurrentTrack = trackNumber;
      globalIsPlaying = true;
      setCurrentTrack(trackNumber);
      setIsPlaying(true);
      
      console.log(`Playing BGM track ${trackNumber}`);
    } catch (error) {
      console.warn(`Failed to play BGM track ${trackNumber}:`, error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.musicEnabled]); // Added settings.musicEnabled

  const nextTrack = useCallback(() => {
    const next = globalCurrentTrack >= trackCount ? 1 : globalCurrentTrack + 1;
    playTrack(next);
  }, [playTrack, trackCount]);

  const pauseMusic = useCallback(() => {
    if (globalAudioRef && globalIsPlaying) {
      globalAudioRef.pause();
      globalIsPlaying = false;
      setIsPlaying(false);
    }
  }, []); // Added missing dependency array and closing parenthesis for useCallback

  const resumeMusic = useCallback(() => {
    if (globalAudioRef && !globalIsPlaying && settings.musicEnabled) {
      globalAudioRef.play().then(() => {
        globalIsPlaying = true;
        setIsPlaying(true);
      }).catch(error => {
        console.warn('Failed to resume music:', error);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.musicEnabled]); // Added settings.musicEnabled

  // Auto-start music when enabled or when component mounts
  useEffect(() => {
    if (settings.musicEnabled && !globalIsPlaying) {
      playTrack(globalCurrentTrack);
    } else if (!settings.musicEnabled && globalIsPlaying) {
      pauseMusic();
    }
  }, [settings.musicEnabled, playTrack, pauseMusic]);

  // Start music immediately when hook initializes (if enabled)
  useEffect(() => {
    if (settings.musicEnabled && globalAudioRef && !globalIsPlaying) {
      // Small delay to ensure audio context is ready
      setTimeout(() => {
        playTrack(globalCurrentTrack);
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.musicEnabled, playTrack]); // Added settings.musicEnabled and playTrack

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
