import { useCallback } from 'react';
import { GameState, MusicGenre, Band } from '@/types/game'; // Import Band from game types
import { Song } from '@/types/songs'; // Import Song directly from its definition file
import { toast } from '@/components/ui/use-toast';
import { addPlayerSongToCharts } from '@/data/chartsData'; // Import the new function

export interface SongManagement {
  createSong: (bandId: string, title: string, genre: MusicGenre) => void;
  releaseSong: (songId: string) => void;
}

export const useSongManagement = (
  gameState: GameState,
  updateGameState: (updater: (prevState: GameState) => GameState) => void
): SongManagement => {

  const createSong = useCallback((bandId: string, title: string, genre: MusicGenre): void => {
    const associatedBand = gameState.playerBands.find(band => band.id === bandId);

    if (!associatedBand) {
      toast({
        title: "Error",
        description: "Associated band not found.",
        variant: "destructive"
      });
      return;
    }

    const newSong: Song = {
      id: `song_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      genre,
      quality: 50, // Initial quality, can be influenced by studio/staff later
      productionValue: 50, // Initial production value
      releaseDate: null,
      associatedBandId: bandId,
      initialBuzz: 0,
      chartEntryPotential: 0,
      totalSales: 0,
      currentChartPosition: null,
      performanceHistory: [],
      isReleased: false,
    };

    updateGameState((prev: GameState) => ({
      ...prev,
      songs: [...prev.songs, newSong]
    }));

    toast({
      title: "Song Created",
      description: `"${title}" by ${associatedBand.bandName} has been created!`,
    });
  }, [gameState.playerBands, updateGameState]);

  const releaseSong = useCallback((songId: string): void => {
    const songToRelease = gameState.songs.find(song => song.id === songId);

    if (!songToRelease) {
      toast({
        title: "Error",
        description: "Song not found.",
        variant: "destructive"
      });
      return;
    }

    if (songToRelease.isReleased) {
      toast({
        title: "Already Released",
        description: `"${songToRelease.title}" has already been released.`,
        variant: "destructive"
      });
      return;
    }

    updateGameState((prev: GameState) => {
      const updatedSongs = prev.songs.map(song =>
        song.id === songId
          ? { ...song, isReleased: true, releaseDate: prev.currentDay }
          : song
      );

      const releasedSong = updatedSongs.find(song => song.id === songId);
      const associatedBand = prev.playerBands.find(band => band.id === releasedSong?.associatedBandId);

      let updatedCharts = prev.chartsData?.charts || [];
      if (releasedSong && associatedBand) {
        updatedCharts = addPlayerSongToCharts(updatedCharts, releasedSong, prev.currentDay, associatedBand.reputation);
      }

      return {
        ...prev,
        songs: updatedSongs,
        chartsData: {
          ...(prev.chartsData || {
            availableCharts: [],
            contactedArtists: [],
            marketTrends: [],
            discoveredArtists: [],
            lastChartUpdate: 0,
          }),
          charts: updatedCharts,
        },
      };
    });

    toast({
      title: "Song Released!",
      description: `"${songToRelease.title}" has been released!`,
    });
  }, [gameState.songs, gameState.currentDay, updateGameState]);

  return {
    createSong,
    releaseSong,
  };
};