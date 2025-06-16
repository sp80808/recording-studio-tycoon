import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming Select component is available
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chart, ChartEntry, MarketTrend } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends, calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { ArtistContactModal } from './modals/ArtistContactModal';
import { Play, Pause, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ChartDisplay } from './charts/ChartDisplay';
import { MarketTrendsDisplay } from './charts/MarketTrendsDisplay';
import { MusicIndustryReport } from './charts/MusicIndustryReport';
import { gameAudio } from '@/utils/audioSystem'; // Import gameAudio

interface ChartsPanelProps {
  gameState: GameState;
  onContactArtist: (artistId: string, offer: number) => void;
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ gameState, onContactArtist }) => {
  const [availableCharts, setAvailableCharts] = useState<Chart[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>('hot100');
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ChartEntry | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [key: string]: number }>({});
  // audioRef and progressIntervalRef are no longer needed with GameAudioSystem
  const [currentSourceNode, setCurrentSourceNode] = useState<AudioBufferSourceNode | null>(null);


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

  // Audio clip mapping with extensive cross-genre mixing for maximum variety
  const getAudioClip = (entry: ChartEntry): string | null => {
    const genre = entry.song.genre.toLowerCase();
    
    // Comprehensive audio map with intelligent cross-genre blending
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

    // Get clips for the genre, with fallback to similar genres
    let clips = audioMap[genre];
    
    if (!clips || clips.length === 0) {
      // Advanced fallback system based on genre similarity
      const fallbackMap: { [key: string]: string } = {
        'classical': 'jazz',
        'ambient': 'electronic',
        'techno': 'electronic',
        'house': 'electronic',
        'trap': 'hip-hop',
        'rap': 'hip-hop',
        'gospel': 'r&b',
        'ska': 'punk',
        'grunge': 'alternative',
        'hardcore': 'metal',
        'new wave': 'electronic',
        'synthpop': 'electronic',
        'disco': 'dance'
      };
      
      const fallbackGenre = fallbackMap[genre] || 'pop';
      clips = audioMap[fallbackGenre] || audioMap['pop'];
    }

    if (clips && clips.length > 0) {
      // Enhanced seed calculation for more varied selection
      const artistSeed = entry.song.artist.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const titleSeed = entry.song.title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const complexSeed = entry.position + 
                         entry.song.artist.popularity + 
                         artistSeed + 
                         titleSeed + 
                         entry.weeksOnChart * 3;
      
      const clipIndex = complexSeed % clips.length;
      return clips[clipIndex];
    }
    
    return null;
  };

  // Calculate which 25-second segment to play with timestamps for maximum variety
  const getPlaybackSegment = (entry: ChartEntry): { startTime: number, endTime: number, segmentNumber: number, displayTime: string } => {
    // Create a sophisticated seed for deterministic but varied selection
    const seed = entry.song.title.charCodeAt(0) + 
                 entry.song.artist.name.charCodeAt(0) + 
                 entry.position + 
                 entry.song.artist.popularity + 
                 entry.weeksOnChart;
    
    // Calculate overlapping segments with 25-second duration
    const segmentDuration = 25;
    const overlapTime = 5; // 5 seconds overlap between segments
    const segmentNumber = (seed % 6) + 1; // 6 segments max
    const startTime = (segmentNumber - 1) * overlapTime;
    const endTime = startTime + segmentDuration;
    
    const formatTime = (seconds: number) => 
      `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    
    return {
      startTime,
      endTime,
      segmentNumber,
      displayTime: `${formatTime(startTime)}-${formatTime(endTime)}`
    };
  };

  const playAudioClip = async (entry: ChartEntry) => {
    const clipName = getAudioClip(entry);
    if (!clipName) return;

    const trackId = `${entry.song.id}-${entry.position}`;
    const segment = getPlaybackSegment(entry); // Still useful for displayTime and segmentNumber
    const audioPath = `/audio/chart_clips/${clipName}`;

    // Stop current audio if playing
    if (currentSourceNode) {
      try {
        currentSourceNode.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      setCurrentSourceNode(null);
    }
    
    // If clicking the same track that was playing, just stop it
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
      // Reset progress (visual only for now, actual playback duration not controlled here yet)
      setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 })); 
      return;
    }

    gameAudio.playSound(audioPath, 'sfx').then(sourceNode => {
      if (sourceNode) {
        setCurrentSourceNode(sourceNode);
        setCurrentlyPlaying(trackId);
        // Basic progress simulation: set to 100% after a delay, or handle onended
        // For true progress, GameAudioSystem would need to provide updates or control
        setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 })); // Start progress
        
        // Simulate progress for 25s or until sound ends
        // This is a simplified visual progress, not tied to actual audio playback position
        let progress = 0;
        const intervalTime = 250; // Update 4 times a second
        const totalDurationMs = 25 * 1000;
        const steps = totalDurationMs / intervalTime;
        let currentStep = 0;

        const progressInterval = setInterval(() => {
          currentStep++;
          progress = (currentStep / steps) * 100;
          setPlaybackProgress(prev => ({ ...prev, [trackId]: Math.min(progress, 100) }));
          if (currentStep >= steps) {
            clearInterval(progressInterval);
            if (currentlyPlaying === trackId) { // Check if it's still the one playing
              setCurrentlyPlaying(null);
              setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
            }
          }
        }, intervalTime);

        sourceNode.onended = () => {
          clearInterval(progressInterval);
          // Only reset if this specific track was the one playing and ended
          if (currentlyPlaying === trackId) { 
            setCurrentlyPlaying(null);
            setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
          }
          if (currentSourceNode === sourceNode) {
            setCurrentSourceNode(null);
          }
        };
      } else {
        console.warn(`Could not play audio clip: ${clipName}`);
        setCurrentlyPlaying(null);
        setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
      }
    }).catch(error => {
      console.warn(`Audio playback error for ${clipName}:`, error);
      setCurrentlyPlaying(null);
      setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
    });
  };

  // Generate charts when component mounts or player level changes
  useEffect(() => {
    try {
      const charts = generateCharts(gameState.playerData.level, gameState.currentEra);
      if (charts && charts.length > 0) {
        const accessibleCharts = charts.filter(chart => chart.minLevelToAccess <= gameState.playerData.level);
        setAvailableCharts(accessibleCharts);

        // Set default chart if current selection is not available
        if (!accessibleCharts.find(c => c.id === selectedChart)) {
          setSelectedChart(accessibleCharts[0]?.id || 'hot100');
        }
      } else {
        console.warn('No charts generated for era:', gameState.currentEra);
        setAvailableCharts([]);
      }
    } catch (error) {
      console.error('Error generating charts:', error);
      setAvailableCharts([]);
    }
  }, [gameState.playerData.level, gameState.currentEra, selectedChart]);

  // Generate market trends
  useEffect(() => {
    setMarketTrends(generateMarketTrends());
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentSourceNode) {
        try {
          currentSourceNode.stop();
        } catch(e) { /* ignore */ }
        setCurrentSourceNode(null);
      }
      // Any active intervals for progress should also be cleared here if not handled by onended
    };
  }, [currentSourceNode]); // Add currentSourceNode to dependency array

  const currentChart = availableCharts.find(chart => chart.id === selectedChart);

  const getMovementIcon = (movement: ChartEntry['movement']) => {
    switch (movement) {
      case 'up': return <ArrowUp className="h-3 w-3" />;
      case 'down': return <ArrowDown className="h-3 w-3" />;
      case 'new': return '🆕';
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getMovementColor = (movement: ChartEntry['movement']) => {
    switch (movement) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'new': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

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
      <div className="w-48"> {/* Adjust width as needed */}
        <Select onValueChange={setSelectedChart} value={selectedChart}>
          <SelectTrigger>
            <SelectValue placeholder="Select a chart" />
          </SelectTrigger>
          <SelectContent>
            {availableCharts.map(chart => (
              <SelectItem key={chart.id} value={chart.id}>
                {chart.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart Display */}
      {currentChart && (
        <ChartDisplay
          chart={currentChart}
          gameState={gameState}
          onContactArtist={handleContactArtist}
          currentlyPlaying={currentlyPlaying}
          playbackProgress={playbackProgress}
          playAudioClip={playAudioClip}
          getAudioClip={getAudioClip}
          getPlaybackSegment={getPlaybackSegment}
          getGenreEmoji={getGenreEmoji}
        />
      )}

      {/* Market Trends */}
      {marketTrends.length > 0 && (
        <MarketTrendsDisplay marketTrends={marketTrends} getGenreEmoji={getGenreEmoji} />
      )}

      {/* Music Industry Report - Available at level 5+ */}
      {gameState.playerData.level >= 5 && (
        <div className="mt-4">
          <MusicIndustryReport />
        </div>
      )}

      {/* Unlock Information */}
      {gameState.playerData.level < 10 && (
        <Card className="bg-blue-900/20 border-blue-600/50 p-3">
          <div className="text-sm text-blue-300">
            <div className="font-semibold mb-1">🔓 Unlock More Charts</div>
            <div className="text-xs space-y-1">
              {gameState.playerData.level < 3 && <div>• Rock Charts at Level 3</div>}
              {gameState.playerData.level < 4 && <div>• Pop Charts at Level 4</div>}
              {gameState.playerData.level < 5 && <div>• Hip-hop Charts at Level 5</div>}
              {gameState.playerData.level < 6 && <div>• Electronic Charts at Level 6</div>}
              {gameState.playerData.level < 8 && <div>• Top 10 Artist Access at Level 8</div>}
            </div>
          </div>
        </Card>
      )}

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
