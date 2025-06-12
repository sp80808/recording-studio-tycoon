import { useState, useRef, useEffect, useCallback } from 'react';
import { ChartEntry } from '@/types/charts';
import { GameState } from '@/types/game'; // Assuming gameState.currentEra is needed for getAudioClip

export interface ChartAudioPlayback {
  currentlyPlaying: string | null;
  playbackProgress: { [key: string]: number };
  playAudioClip: (entry: ChartEntry, gameState: GameState) => void;
  getAudioClip: (entry: ChartEntry, gameState: GameState) => string | null;
  getPlaybackSegment: (entry: ChartEntry) => { startTime: number; endTime: number; segmentNumber: number; displayTime: string };
}

export const useChartAudio = (): ChartAudioPlayback => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [key: string]: number }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAudioClip = useCallback((entry: ChartEntry, gameState: GameState): string | null => {
    const genre = entry.song.genre.toLowerCase();
    // const era = gameState.currentEra; // gameState.currentEra would be passed if needed by audioMap logic
    
    const audioMap: { [key: string]: string[] } = {
      'rock': ['60s-chart-track5.mp3', '80s-Power-Chord1.mp3', '80s-Power-Chord2.mp3', '00sAlt-Rock-Energy1.mp3', '00sNu-Metal-Vibe2.mp3'],
      'pop': ['60s-Pop2.mp3', '80schart-anthem1.mp3', '00sStreaming-Ready1.mp3', '80s-Power-Chord1.mp3', '00s-rnb2.mp3'],
      'electronic': ['80s-Synthesizer1.mp3', '2000s-Electronic1.mp3', '00sElectronic-Hybrid2.mp3', '80schart-anthem1.mp3', '00sNu-Metal-Vibe2.mp3'],
      'hip-hop': ['80s-Power-Chord2.mp3', '00sNu-Metal-Vibe2.mp3', '00sElectronic-Hybrid2.mp3', '00s-rnb3.mp3', '2000s-Electronic1.mp3'],
      'r&b': ['00s-rnb1.mp3', '00s-rnb2.mp3', '00s-rnb3.mp3', '60s-Pop2.mp3', '80schart-anthem1.mp3'],
      'country': ['2000s-Country3.mp3', '60s-chart-track5.mp3', '80s-Power-Chord1.mp3', '00sAlt-Rock-Energy1.mp3'],
      'jazz': ['60s-chart-track5.mp3', '00s-rnb1.mp3', '00s-rnb2.mp3'],
      'indie': ['00sAlt-Rock-Energy1.mp3', '80s-Synthesizer1.mp3', '60s-Pop2.mp3', '60s-chart-track5.mp3'],
      'alternative': ['00sNu-Metal-Vibe2.mp3', '00sAlt-Rock-Energy1.mp3', '80s-Power-Chord2.mp3', '00sElectronic-Hybrid2.mp3'],
      'metal': ['00sNu-Metal-Vibe2.mp3', '80s-Power-Chord2.mp3', '80s-Power-Chord1.mp3'],
      'punk': ['80s-Power-Chord2.mp3', '00sAlt-Rock-Energy1.mp3', '00sNu-Metal-Vibe2.mp3'],
      'dance': ['80s-Synthesizer1.mp3', '2000s-Electronic1.mp3', '00sElectronic-Hybrid2.mp3', '80schart-anthem1.mp3'],
      'funk': ['00s-rnb2.mp3', '80s-Power-Chord1.mp3', '00s-rnb3.mp3'],
      'soul': ['00s-rnb1.mp3', '00s-rnb3.mp3', '60s-Pop2.mp3'],
      'blues': ['60s-chart-track5.mp3', '80s-Power-Chord1.mp3', '00s-rnb1.mp3'],
      'folk': ['60s-chart-track5.mp3', '2000s-Country3.mp3', '60s-Pop2.mp3'],
      'reggae': ['00s-rnb2.mp3', '80s-Power-Chord1.mp3', '60s-Pop2.mp3']
    };
    let clips = audioMap[genre];
    if (!clips || clips.length === 0) {
      const fallbackMap: { [key: string]: string } = {
        'classical': 'jazz', 'ambient': 'electronic', 'techno': 'electronic', 'house': 'electronic',
        'trap': 'hip-hop', 'rap': 'hip-hop', 'gospel': 'r&b', 'ska': 'punk', 'grunge': 'alternative',
        'hardcore': 'metal', 'new wave': 'electronic', 'synthpop': 'electronic', 'disco': 'dance'
      };
      const fallbackGenre = fallbackMap[genre] || 'pop';
      clips = audioMap[fallbackGenre] || audioMap['pop'];
    }
    if (clips && clips.length > 0) {
      const artistSeed = entry.song.artist.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const titleSeed = entry.song.title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const complexSeed = entry.position + entry.song.artist.popularity + artistSeed + titleSeed + entry.weeksOnChart * 3;
      const clipIndex = complexSeed % clips.length;
      return clips[clipIndex];
    }
    return null;
  }, []);

  const getPlaybackSegment = useCallback((entry: ChartEntry): { startTime: number; endTime: number; segmentNumber: number; displayTime: string } => {
    const seed = entry.song.title.charCodeAt(0) + entry.song.artist.name.charCodeAt(0) + entry.position + entry.song.artist.popularity + entry.weeksOnChart;
    const segmentDuration = 25;
    const overlapTime = 5;
    const segmentNumber = (seed % 6) + 1;
    const startTime = (segmentNumber - 1) * overlapTime;
    const endTime = startTime + segmentDuration;
    const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    return { startTime, endTime, segmentNumber, displayTime: `${formatTime(startTime)}-${formatTime(endTime)}` };
  }, []);

  const playAudioClip = useCallback(async (entry: ChartEntry, gameState: GameState) => {
    const clipName = getAudioClip(entry, gameState);
    if (!clipName) return;

    const trackId = `${entry.song.id}-${entry.position}`;
    const segment = getPlaybackSegment(entry);

    if (audioRef.current) {
      audioRef.current.pause();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
      setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
      return;
    }

    try {
      const audio = new Audio(`/src/audio/chart_clips/${clipName}`);
      audioRef.current = audio;
      audio.addEventListener('loadedmetadata', () => {
        const safeStartTime = Math.min(segment.startTime, audio.duration - 25);
        audio.currentTime = Math.max(0, safeStartTime);
        setCurrentlyPlaying(trackId);
        audio.play();
        const playbackStartTime = audio.currentTime;
        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime && audio.duration && !audio.paused) {
            const elapsed = audio.currentTime - playbackStartTime;
            const progress = Math.min((elapsed / 25) * 100, 100);
            setPlaybackProgress(prev => ({ ...prev, [trackId]: progress }));
            if (elapsed >= 25 || audio.currentTime >= segment.endTime || audio.currentTime >= audio.duration - 0.5) {
              audio.pause();
              setCurrentlyPlaying(null);
              setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }
          }
        }, 50);
      });
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      });
      audio.addEventListener('error', (e) => {
        console.warn(`Could not load audio clip: ${clipName}`, e);
        setCurrentlyPlaying(null);
        setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
      });
    } catch (error) {
      console.warn(`Audio playback error for ${clipName}:`, error);
      setCurrentlyPlaying(null);
      setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
    }
  }, [currentlyPlaying, getAudioClip, getPlaybackSegment]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    currentlyPlaying,
    playbackProgress,
    playAudioClip,
    getAudioClip,
    getPlaybackSegment,
  };
};
