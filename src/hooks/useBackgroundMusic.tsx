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
}

export const useBackgroundMusic = (): BackgroundMusicManager => {
  const [currentTrack, setCurrentTrack] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackCount = 5; // We have 5 BGM tracks

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
    };
  }, []);

  // Update volume when settings change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicEnabled ? settings.musicVolume : 0;
    }
  }, [settings.musicVolume, settings.musicEnabled]);

  const playTrack = async (trackNumber: number) => {
    if (!audioRef.current || !settings.musicEnabled) return;

    try {
      // Stop current track
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // Load new track
      audioRef.current.src = `/src/audio/music/Tycoon BGM ${trackNumber}.mp3`;
      
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
    resumeMusic
  };
};
