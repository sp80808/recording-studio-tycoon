import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chart, ChartEntry, MarketTrend } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends, calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { ArtistContactModal } from './modals/ArtistContactModal';
import { ChartEntryRow } from './charts/ChartEntryRow';
import { MarketTrendsDisplay } from './charts/MarketTrendsDisplay';
import { UnlockInfoPanel } from './charts/UnlockInfoPanel';
import { useChartAudio } from '@/hooks/useChartAudio';
import { useChartPanelData } from '@/hooks/useChartPanelData'; // Added import
import { Play, Pause, Volume2, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ChartsPanelProps {
  gameState: GameState;
  onContactArtist: (artistId: string, offer: number) => void;
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ gameState, onContactArtist }) => {
  // Chart data state and logic from custom hook
  const {
    availableCharts,
    selectedChart,
    setSelectedChart,
    marketTrends,
    currentChartInstance,
  } = useChartPanelData(gameState);

  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ChartEntry | null>(null);
  
  // Audio state and functions from custom hook
  const { 
    currentlyPlaying, 
    playbackProgress, 
    playAudioClip: playChartAudioClip, // Renamed to avoid conflict if ChartsPanelProps had a playAudioClip
    getAudioClip: getChartAudioClip, 
    getPlaybackSegment: getChartPlaybackSegment 
  } = useChartAudio();
  // Removed local audio state and refs:
  // const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  // const [playbackProgress, setPlaybackProgress] = useState<{ [key: string]: number }>({});
  // const audioRef = useRef<HTMLAudioElement | null>(null);
  // const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Genre emoji mapping for visual appeal
  const getGenreEmoji = (genre: string) => {
    const emojiMap: { [key: string]: string } = {
      'pop': '🎵',
      'rock': '🎸',
      'hip-hop': '🎤',
      'electronic': '🎛️',
      'jazz': '🎺',
      'classical': '🎼',
      'country': '🤠',
      'r&b': '🎶',
      'reggae': '🌴',
      'folk': '🪕',
      'blues': '🎷',
      'punk': '⚡',
      'metal': '🔥',
      'indie': '🎭',
      'alternative': '🌟',
      'funk': '🕺'
    };
    return emojiMap[genre.toLowerCase()] || '🎵';
  };

  // Audio logic moved to useChartAudio hook
  // const getAudioClip = ...
  // const getPlaybackSegment = ...
  // const playAudioClip = ...

  // Chart data generation logic moved to useChartPanelData hook
  // useEffect(() => { ... }); // for charts
  // useEffect(() => { ... }); // for market trends

  // currentChart is now currentChartInstance from useChartPanelData hook
  // const currentChart = availableCharts.find(chart => chart.id === selectedChart);


  // getMovementIcon and getMovementColor are now in ChartEntryRow
  // const getMovementIcon = (movement: ChartEntry['movement']) => { ... };
  // const getMovementColor = (movement: ChartEntry['movement']) => { ... };

  const handleContactArtist = (entry: ChartEntry) => {
    if (!isArtistContactable(entry, gameState.playerData.level, gameState.playerData.reputation)) {
      return;
    }

    setSelectedArtist(entry);
    setShowContactModal(true);

    onContactArtist(entry.song.artist.id, 100);
  };

  const handleSubmitContact = (offer: number) => {
    if (selectedArtist) {
      onContactArtist(selectedArtist.song.artist.id, offer);
      setShowContactModal(false);
      setSelectedArtist(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">📈 Industry Charts</h3>
        <Badge variant="outline" className="text-blue-400 border-blue-400">
          Level {gameState.playerData.level}
        </Badge>
      </div>

      {/* Chart Selector */}
      <div className="flex flex-wrap gap-2">
        {availableCharts.map(chart => (
          <Button
            key={chart.id}
            onClick={() => setSelectedChart(chart.id)}
            variant={selectedChart === chart.id ? 'default' : 'outline'}
            size="sm"
            className={selectedChart === chart.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {chart.name}
          </Button>
        ))}
      </div>

            className={selectedChart === chart.id ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {chart.name}
          </Button>
        ))}
      </div>

      {/* Chart Display */}
      {currentChart && (
        <Card className="bg-gray-800/50 border-gray-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">{currentChart.name}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentChart.region}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Updates weekly
              </Badge>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">{currentChart.description}</p>

          {/* Chart Entries - Enhanced Layout like Billboard */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {currentChart.entries.slice(0, 20).map((entry) => (
              <ChartEntryRow
                key={`${entry.song.id}-${entry.position}`}
                entry={entry}
                gameState={gameState}
                onContactArtist={handleContactArtist}
                currentlyPlaying={currentlyPlaying}
                playbackProgress={playbackProgress}
                playAudioClip={(entry) => playChartAudioClip(entry, gameState)}
                getAudioClip={(entry) => getChartAudioClip(entry, gameState)}
                getPlaybackSegment={getChartPlaybackSegment}
                getGenreEmoji={getGenreEmoji}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Market Trends */}
      {marketTrends.length > 0 && (
        <MarketTrendsDisplay marketTrends={marketTrends} getGenreEmoji={getGenreEmoji} />
      )}

      {/* Unlock Information */}
      <UnlockInfoPanel playerLevel={gameState.playerData.level} />

      {/* Artist Contact Modal */}
      {selectedArtist && (
        <ArtistContactModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setSelectedArtist(null);
          }}
          chartEntry={selectedArtist}
          gameState={gameState}
          onSubmit={handleSubmitContact}
        />
      )}
    </div>
  );
};
