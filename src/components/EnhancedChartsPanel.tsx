import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { Chart } from '@/types/charts';
import { ArtistContact } from '@/types/charts';
import { toast } from '@/hooks/use-toast';

interface EnhancedChartsPanelProps {
  gameState: GameState;
  onContactArtist: (artistId: string, offer: number) => void;
}

export const EnhancedChartsPanel: React.FC<EnhancedChartsPanelProps> = ({
  gameState,
  onContactArtist
}) => {
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Use playerData.completedProjects instead of gameState.completedProjects
  const unlockedGenres = Math.min(gameState.playerData.completedProjects || 0, 3);
  const isChartsUnlocked = (gameState.playerData.completedProjects || 0) >= 2;

  const handleChartSelect = (chart: Chart) => {
    setSelectedChart(chart);
    setSelectedArtist(null);
    stopAudio();
  };

  const handleArtistSelect = (artist: any) => {
    setSelectedArtist(artist);
    stopAudio();
  };

  const playAudio = useCallback((trackUrl: string, trackId: string) => {
    stopAudio();

    const audio = new Audio(trackUrl);
    setCurrentAudio(audio);
    setPlayingTrack(trackId);

    audio.play().catch(error => {
      console.error("Playback failed:", error);
      toast({
        title: "Playback Error",
        description: "Failed to play the selected track.",
        variant: "destructive"
      });
      setPlayingTrack(null);
    });

    audio.onended = () => {
      setPlayingTrack(null);
    };

    audio.onerror = () => {
      toast({
        title: "Audio Error",
        description: "There was an issue loading the audio track.",
        variant: "destructive"
      });
      setPlayingTrack(null);
    };
  }, [toast]);

  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingTrack(null);
    }
  }, [currentAudio]);

  const handleContactArtist = (artistId: string, offer: number) => {
    onContactArtist(artistId, offer);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  if (!isChartsUnlocked) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-600">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-bold mb-2">Charts Locked</h3>
          <p className="text-sm">
            Complete {2 - (gameState.playerData.completedProjects || 0)} more projects to unlock the music charts system.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {gameState.chartsData?.charts && gameState.chartsData.charts.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Charts</h3>
          <div className="flex overflow-x-auto gap-2">
            {gameState.chartsData.charts.map((chart, index) => (
              <Button
                key={chart.id}
                variant={selectedChart?.id === chart.id ? 'default' : 'outline'}
                onClick={() => handleChartSelect(chart)}
                className="whitespace-nowrap text-xs"
                disabled={index > unlockedGenres}
              >
                {chart.genre} Chart {index > unlockedGenres ? ' (Locked)' : ''}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-4 bg-gray-800/50 border-gray-600">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">🎵</div>
            <h3 className="font-semibold mb-1">No Charts Available</h3>
            <p className="text-sm">Check back later for updated music charts.</p>
          </div>
        </Card>
      )}

      {selectedChart && selectedChart.tracks && selectedChart.tracks.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">
            Top Tracks in {selectedChart.genre}
          </h3>
          <div className="space-y-3">
            {selectedChart.tracks.map(track => (
              <Card
                key={track.id}
                className={`p-3 bg-gray-700/50 border-gray-600 cursor-pointer hover:bg-gray-600/50 ${selectedArtist?.id === track.artist.id ? 'border-2 border-blue-500' : ''}`}
                onClick={() => handleArtistSelect(track.artist)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{track.title}</div>
                    <div className="text-sm text-gray-300">{track.artist.name}</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (playingTrack === track.id) {
                        stopAudio();
                      } else {
                        playAudio(track.audioUrl, track.id);
                      }
                    }}
                  >
                    {playingTrack === track.id ? 'Stop' : 'Play'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : selectedChart ? (
        <Card className="p-4 bg-gray-800/50 border-gray-600">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">🎤</div>
            <h3 className="font-semibold mb-1">No Tracks Available</h3>
            <p className="text-sm">
              There are currently no tracks listed in the {selectedChart.genre} chart.
            </p>
          </div>
        </Card>
      ) : null}

      {selectedArtist && (
        <Card className="p-4 bg-gray-700/50 border-gray-600">
          <h3 className="text-lg font-bold text-white mb-2">
            Artist: {selectedArtist.name}
          </h3>
          <div className="text-gray-300 text-sm space-y-2">
            <p>Genre: {selectedArtist.genre}</p>
            <p>Popularity: {selectedArtist.popularity}</p>
            <p>Demand: {selectedArtist.demandLevel}</p>
            <p>Price Range: ${selectedArtist.priceRange.min} - ${selectedArtist.priceRange.max}</p>
          </div>
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-300 mb-2">Make Offer</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`Enter offer (Max: ${selectedArtist.priceRange.max})`}
                className="bg-gray-800 border-gray-600 rounded p-2 text-white text-sm flex-grow"
                id="artistOffer"
              />
              <Button
                onClick={() => {
                  const offerInput = document.getElementById('artistOffer') as HTMLInputElement;
                  const offer = parseInt(offerInput.value, 10);
                  if (isNaN(offer) || offer <= 0 || offer > selectedArtist.priceRange.max) {
                    toast({
                      title: "Invalid Offer",
                      description: `Please enter a valid offer between $1 and $${selectedArtist.priceRange.max}.`,
                      variant: "destructive"
                    });
                  } else {
                    handleContactArtist(selectedArtist.id, offer);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Contact Artist
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
