import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chart, ChartEntry, MarketTrend } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends, calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { ArtistContactModal } from './modals/ArtistContactModal';
import { Play, Pause, Volume2, TrendingUp, Clock, Star } from 'lucide-react';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate charts when component mounts or player level changes
  useEffect(() => {
    const charts = generateCharts(gameState.playerData.level, gameState.currentEra);
    const accessibleCharts = charts.filter(chart => chart.minLevelToAccess <= gameState.playerData.level);
    setAvailableCharts(accessibleCharts);

    // Set default chart if current selection is not available
    if (!accessibleCharts.find(c => c.id === selectedChart)) {
      setSelectedChart(accessibleCharts[0]?.id || 'hot100');
    }
  }, [gameState.playerData.level, gameState.currentEra, selectedChart]);

  // Generate market trends
  useEffect(() => {
    setMarketTrends(generateMarketTrends());
  }, []);

  // Cleanup audio on unmount
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

  // Audio clip mapping with extensive cross-genre mixing for maximum variety
  const getAudioClip = (entry: ChartEntry): string | null => {
    const genre = entry.song.genre.toLowerCase();
    const era = gameState.currentEra;
    
    // Comprehensive audio map with intelligent cross-genre blending
    const audioMap: { [key: string]: string[] } = {
      'rock': ['60s-chart-track5.mp3', '80s-Power-Chord1.mp3', '80s-Power-Chord2.mp3', '00sAlt-Rock-Energy1.mp3', '00sNu-Metal-Vibe2.mp3'],
      'pop': ['60s-Pop2.mp3', '80schart-anthem1.mp3', '00sStreaming-Ready1.mp3', '80s-Power-Chord1.mp3', '00s-rnb2.mp3'], // Pop-rock and pop-R&B crossover
      'electronic': ['80s-Synthesizer1.mp3', '2000s-Electronic1.mp3', '00sElectronic-Hybrid2.mp3', '80schart-anthem1.mp3', '00sNu-Metal-Vibe2.mp3'], // Electronic rock fusion
      'hip-hop': ['80s-Power-Chord2.mp3', '00sNu-Metal-Vibe2.mp3', '00sElectronic-Hybrid2.mp3', '00s-rnb3.mp3', '2000s-Electronic1.mp3'], // Hip-hop with various production styles
      'r&b': ['00s-rnb1.mp3', '00s-rnb2.mp3', '00s-rnb3.mp3', '60s-Pop2.mp3', '80schart-anthem1.mp3'], // Contemporary R&B with pop influences
      'country': ['2000s-Country3.mp3', '60s-chart-track5.mp3', '80s-Power-Chord1.mp3', '00sAlt-Rock-Energy1.mp3'], // Country-rock crossover
      'jazz': ['60s-chart-track5.mp3', '00s-rnb1.mp3', '00s-rnb2.mp3'], // Smooth jazz and contemporary jazz-R&B
      'indie': ['00sAlt-Rock-Energy1.mp3', '80s-Synthesizer1.mp3', '60s-Pop2.mp3', '60s-chart-track5.mp3'], // Indie variety
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

  // Calculate which 25-second segment to play for maximum variety
  const getPlaybackSegment = (entry: ChartEntry, clipDuration: number = 120): { startTime: number, duration: number, segment: number } => {
    // Create a more sophisticated seed for deterministic but varied selection
    const seed = entry.song.title.length + 
                 entry.position + 
                 entry.song.artist.popularity + 
                 entry.song.artist.name.charCodeAt(0) + 
                 entry.weeksOnChart;
    
    // Calculate overlapping segments for smoother transitions and more variety
    const segmentDuration = 25;
    const overlapTime = 5; // 5 seconds overlap between segments
    const maxPossibleSegments = Math.floor((clipDuration - segmentDuration) / overlapTime) + 1;
    const segmentCount = Math.max(1, Math.min(6, maxPossibleSegments)); // Cap at 6 segments max
    
    const segmentIndex = seed % segmentCount;
    const startTime = Math.min(segmentIndex * overlapTime, clipDuration - segmentDuration);
    
    return {
      startTime: Math.max(0, startTime),
      duration: segmentDuration,
      segment: segmentIndex + 1
    };
  };

  const playAudioClip = async (entry: ChartEntry) => {
    const clipName = getAudioClip(entry);
    if (!clipName) return;

    const trackId = `${entry.song.id}-${entry.position}`;
    const segment = getPlaybackSegment(entry);
    
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    // If clicking the same track, just pause
    if (currentlyPlaying === trackId) {
      setCurrentlyPlaying(null);
      setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
      return;
    }

    try {
      const audio = new Audio(`/src/audio/chart_clips/${clipName}`);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        // Calculate actual clip duration for better segment handling
        const actualClipDuration = audio.duration;
        const adjustedSegment = getPlaybackSegment(entry, actualClipDuration);
        
        // Set start time with safety checks
        const safeStartTime = Math.min(adjustedSegment.startTime, actualClipDuration - adjustedSegment.duration);
        if (actualClipDuration > safeStartTime + 5) { // Ensure at least 5s available
          audio.currentTime = safeStartTime;
        } else {
          audio.currentTime = 0; // Fallback to beginning if clip is too short
        }
        
        setCurrentlyPlaying(trackId);
        audio.play();

        const playbackStartTime = audio.currentTime;
        const targetDuration = Math.min(adjustedSegment.duration, actualClipDuration - playbackStartTime);

        // Enhanced progress tracking with better timing
        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime && audio.duration && !audio.paused) {
            const elapsed = audio.currentTime - playbackStartTime;
            const progress = Math.min((elapsed / targetDuration) * 100, 100);
            setPlaybackProgress(prev => ({ ...prev, [trackId]: progress }));

            // Stop after our segment duration or if near end of clip
            if (elapsed >= targetDuration || audio.currentTime >= audio.duration - 0.5) {
              audio.pause();
              setCurrentlyPlaying(null);
              setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
            }
          }
        }, 50); // More frequent updates for smoother progress
      });

      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
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
  };

  const currentChart = availableCharts.find(chart => chart.id === selectedChart);

  const getMovementIcon = (movement: ChartEntry['movement']) => {
    switch (movement) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'new': return '🆕';
      default: return '➡️';
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

          {/* Chart Entries */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {currentChart.entries.slice(0, 20).map((entry, index) => {
              const contactCost = calculateContactCost(
                entry.position,
                entry.song.artist.popularity,
                gameState.playerData.reputation
              );
              const canContact = isArtistContactable(entry, gameState.playerData.level, gameState.playerData.reputation);
              const canAfford = gameState.money >= contactCost;
              const trackId = `${entry.song.id}-${entry.position}`;
              const isPlaying = currentlyPlaying === trackId;
              const hasAudio = getAudioClip(entry) !== null;
              const progress = playbackProgress[trackId] || 0;

              return (
                <Card
                  key={trackId}
                  className="p-4 bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Position & Movement */}
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                      <div className="text-2xl font-bold text-white">
                        {entry.position}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${getMovementColor(entry.movement)}`}>
                        {getMovementIcon(entry.movement)}
                        {entry.positionChange !== 0 && (
                          <span className="text-xs">
                            {Math.abs(entry.positionChange)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Audio Control */}
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playAudioClip(entry)}
                        disabled={!hasAudio}
                        className={`h-12 w-12 rounded-full p-0 transition-all relative group/btn ${
                          isPlaying 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 animate-pulse' 
                            : hasAudio 
                              ? 'bg-gray-600 hover:bg-gray-500 text-gray-200 hover:shadow-md' 
                              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                        title={hasAudio ? 
                          `Play ${getPlaybackSegment(entry).duration}s preview starting at ${getPlaybackSegment(entry).startTime}s` : 
                          'No preview available'
                        }
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        {hasAudio && !isPlaying && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white shadow-sm">
                            {getPlaybackSegment(entry).segment}
                          </div>
                        )}
                        {isPlaying && (
                          <div className="absolute -inset-1 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
                        )}
                      </Button>
                      
                      {/* Enhanced Progress Bar */}
                      {hasAudio && (progress > 0 || isPlaying) && (
                        <div className="w-14 h-1.5 bg-gray-600 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-75 ${
                              isPlaying ? 'bg-green-400 shadow-sm' : 'bg-gray-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      
                      {/* Segment Info */}
                      {hasAudio && (
                        <div className="text-[9px] text-gray-500 text-center leading-tight px-1">
                          <div className="font-medium">Seg {getPlaybackSegment(entry).segment}</div>
                          <div className="text-gray-600">{getPlaybackSegment(entry).startTime}s-{getPlaybackSegment(entry).startTime + getPlaybackSegment(entry).duration}s</div>
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                            {entry.song.title}
                          </h4>
                          <p className="text-sm text-gray-300 truncate">
                            {entry.song.artist.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-400">
                            {entry.song.artist.popularity}/100
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs px-2 py-0 capitalize">
                            {entry.song.genre}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{entry.weeksOnChart}w on chart</span>
                          </div>
                          {entry.peakPosition !== entry.position && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>Peak #{entry.peakPosition}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 truncate">
                          {entry.song.artist.description}
                        </p>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      {canContact && (
                        <Button
                          size="sm"
                          onClick={() => handleContactArtist(entry)}
                          disabled={!canAfford}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs px-3"
                        >
                          Contact Artist
                        </Button>
                      )}
                      <div className="text-xs text-gray-400 text-right">
                        <div className="font-semibold">${contactCost.toLocaleString()}</div>
                        {!canContact && (
                          <div className="text-red-400 mt-1">
                            {entry.position <= 10 ? 'Req. Level 8+' :
                              entry.position <= 25 ? 'Req. Level 5+' : 'Req. Reputation'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Market Trends */}
      {marketTrends.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-600 p-4">
          <h4 className="font-semibold text-white mb-3">📊 Market Trends</h4>
          <div className="grid grid-cols-2 gap-2">
            {marketTrends.slice(0, 6).map(trend => (
              <div
                key={trend.genre}
                className="p-2 bg-gray-700/50 rounded text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize text-gray-300">{trend.genre}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white">{trend.popularity}%</span>
                    <span className={trend.growth > 0 ? 'text-green-400' : trend.growth < 0 ? 'text-red-400' : 'text-gray-400'}>
                      {trend.growth > 0 ? '↗' : trend.growth < 0 ? '↘' : '→'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unlock Information */}
      {gameState.playerData.level < 10 && (
        <Card className="bg-blue-900/20 border-blue-600/50 p-3">
          <div className="text-sm text-blue-300">
            <div className="font-semibold mb-1">🔓 Unlock More Charts</div>
            <div className="text-xs space-y-1">
              {gameState.playerData.level < 3 && <div>• Rock Charts at Level 3</div>}
              {gameState.playerData.level < 4 && <div>• Pop Charts at Level 4</div>}
              {gameState.playerData.level < 5 && <div>• Hip-Hop Charts at Level 5</div>}
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
