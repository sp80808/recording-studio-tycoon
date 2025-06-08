import { useEffect, useRef, useState } from 'react';
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

export const useBackgroundMusic = (): BackgroundMusicManager => {
  const [currentTrack, setCurrentTrack] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackCount = 8; // We have 8 BGM tracks
  const originalVolumeRef = useRef<number>(0.5); // Store original volume
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = false;
      audioRef.current.volume = settings.musicVolume;

      // Auto-advance to next track when current one ends
      audioRef.current.addEventListener('ended', () => {
        nextTrack();
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, []);

  // Update volume when settings change
  useEffect(() => {
    if (audioRef.current) {
      const newVolume = settings.musicEnabled ? settings.musicVolume : 0;
      audioRef.current.volume = newVolume;
      originalVolumeRef.current = settings.musicVolume; // Store the original volume
    }
  }, [settings.musicVolume, settings.musicEnabled]);

  const fadeVolume = async (targetVolume: number, duration: number = 1000): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioRef.current || !settings.musicEnabled) {
        resolve();
        return;
      }

      const startVolume = audioRef.current.volume;
      const volumeDiff = targetVolume - startVolume;
      const steps = 50; // Number of fade steps
      const stepDuration = duration / steps;
      const volumeStep = volumeDiff / steps;
      let currentStep = 0;

      // Clear any existing fade
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      fadeIntervalRef.current = setInterval(() => {
        if (!audioRef.current) {
          resolve();
          return;
        }

        currentStep++;
        const newVolume = startVolume + (volumeStep * currentStep);
        
        if (currentStep >= steps) {
          audioRef.current.volume = targetVolume;
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
          resolve();
        } else {
          audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
        }
      }, stepDuration);
    });
  };

  const restoreVolume = async (duration: number = 1000): Promise<void> => {
    const targetVolume = settings.musicEnabled ? originalVolumeRef.current : 0;
    return fadeVolume(targetVolume, duration);
  };

  const playTrack = async (trackNumber: number) => {
    if (!audioRef.current || !settings.musicEnabled) return;

    try {
      // Stop current track
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Load new track
      audioRef.current.src = `/src/audio/music/tycoon-bgm${trackNumber}.mp3`;
      
      await audioRef.current.play();
      setCurrentTrack(trackNumber);
      setIsPlaying(true);
      
      console.log(`Playing BGM track ${trackNumber}`);
    } catch (error) {
      console.warn(`Failed to play BGM track ${trackNumber}:`, error);
    }
  };

  const nextTrack = () => {
    const next = currentTrack >= trackCount ? 1 : currentTrack + 1;
    playTrack(next);
  };

  const pauseMusic = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeMusic = () => {
    if (audioRef.current && !isPlaying && settings.musicEnabled) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.warn('Failed to resume music:', error);
      });
    }
  };

  // Auto-start music when enabled
  useEffect(() => {
    if (settings.musicEnabled && !isPlaying) {
      playTrack(currentTrack);
    } else if (!settings.musicEnabled && isPlaying) {
      pauseMusic();
    }
  }, [settings.musicEnabled]);

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
