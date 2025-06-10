/**
 * @fileoverview Enhanced charts panel with Billboard-style layout and audio preview
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-08
 * @modified 2025-06-08
 * @lastModifiedBy GitHub Copilot
 * 
 * Features:
 * - Billboard-style music industry charts display
 * - Audio preview system with 25-second intelligent clips
 * - Artist contact system with level-gated access
 * - Market trends analysis and genre popularity tracking
 * - Progress bars and playback controls
 * - Integration with game state and artist contact modal
 */

// filepath: /workspaces/recording-studio-tycoon/src/components/ChartsPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chart, ChartEntry, MarketTrend } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends, calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { ArtistContactModal } from './modals/ArtistContactModal';
import { Play, Pause, Volume2, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';

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
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

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
        // Set start time with safety checks
        const safeStartTime = Math.min(segment.startTime, audio.duration - 25);
        audio.currentTime = Math.max(0, safeStartTime);
        
        setCurrentlyPlaying(trackId);
        audio.play();

        const playbackStartTime = audio.currentTime;

        // Enhanced progress tracking with better timing
        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime && audio.duration && !audio.paused) {
            const elapsed = audio.currentTime - playbackStartTime;
            const progress = Math.min((elapsed / 25) * 100, 100);
            setPlaybackProgress(prev => ({ ...prev, [trackId]: progress }));

            // Stop after 25 seconds or if near end of clip
            if (elapsed >= 25 || audio.currentTime >= segment.endTime || audio.currentTime >= audio.duration - 0.5) {
              audio.pause();
              setCurrentlyPlaying(null);
              setPlaybackProgress(prev => ({ ...prev, [trackId]: 0 }));
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
            }
          }
        }, 50);
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

          {/* Chart Entries - Enhanced Layout like Billboard */}
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
              const segment = getPlaybackSegment(entry);

              return (
                <Card
                  key={trackId}
                  className={`p-2 bg-gray-700/30 border-gray-600/50 transition-all duration-200 group hover:bg-gray-700/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${expandedEntryId === trackId ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setExpandedEntryId(expandedEntryId === trackId ? null : trackId)}
                >
                  <div className="flex items-center gap-3">
                    {/* Chart Position & Movement */}
                    <div className="flex items-center min-w-[40px] text-lg font-bold text-white">
                      {entry.position}
                      <div className={`ml-1 text-xs flex items-center ${getMovementColor(entry.movement)}`}>
                        {getMovementIcon(entry.movement)}
                      </div>
                    </div>

                    {/* Song & Artist Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                        {entry.song.title}
                      </h4>
                      <p className="text-xs text-gray-300 truncate">
                        {entry.song.artist.name}
                      </p>
                    </div>

                    {/* Basic Chart Info (Weeks on Chart) */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 min-w-[40px] justify-end">
                       <Clock className="h-3 w-3" />
                       <span>{entry.weeksOnChart}w</span>
                    </div>
                  </div>
                  {/* Expandable details */}
                  {expandedEntryId === trackId && (
                    <div className="mt-3 pt-3 border-t border-gray-600/50 text-sm text-gray-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-semibold text-white mb-2">Artist & Song Details:</div>
                          <p className="text-xs mb-1">Artist Popularity: <Star className="h-3 w-3 inline text-yellow-500" /> {entry.song.artist.popularity}/100</p>
                          <p className="text-xs mb-1">Peak Position: <TrendingUp className="h-3 w-3 inline text-blue-400" /> #{entry.peakPosition}</p>
                          {/* Placeholder for more artist stats */}
                          <p className="text-xs text-gray-500">[More Artist Stats Placeholder]</p>
                        </div>
                        <div>
                           <div className="font-semibold text-white mb-2">Sales & Charting:</div>
                           {/* Placeholder for sales numbers and graphs */}
                           <p className="text-xs mb-1">Estimated Sales: [Sales Data Placeholder]</p>
                           <p className="text-xs text-gray-500">[Chart Graph Placeholder]</p>
                        </div>
                      </div>

                      {/* Audio Playback Controls */}
                       <div className="flex items-center gap-2 mt-4">
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={(e) => { e.stopPropagation(); playAudioClip(entry); }} // Prevent card click when clicking button
                           disabled={!hasAudio}
                           className={`h-8 w-8 rounded-full p-0 transition-all duration-200 relative group/btn ${
                             isPlaying 
                               ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 animate-pulse' 
                               : hasAudio 
                                 ? 'bg-gray-600 hover:bg-gray-500 text-gray-200 hover:shadow-md hover:scale-105 active:scale-95' 
                                 : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                           }`}
                           title={hasAudio ? `Play preview: ${segment.displayTime}` : 'No preview available'}
                         >
                           {isPlaying ? <Pause className="h-4 w-4 transition-transform duration-200" /> : <Play className="h-4 w-4 transition-transform duration-200" />}
                         </Button>
                         {hasAudio && (progress > 0 || isPlaying) && (
                           <div className="w-24 h-1.5 bg-gray-600 rounded-full overflow-hidden shadow-inner">
                             <div 
                               className={`h-full transition-all duration-200 ease-linear ${
                                 isPlaying ? 'bg-green-400 shadow-sm' : 'bg-gray-400'
                               }`}
                               style={{ width: `${progress}%` }}
                             />
                           </div>
                         )}
                         {hasAudio && (
                           <div className="text-[8px] text-gray-500">
                             {segment.displayTime}
                           </div>
                         )}
                       </div>

                      {/* Study Track Button (Level Gated) */}
                      <div className="mt-4">
                        {/* Level gating logic: Requires player level >= 5 to study tracks */}
                        {gameState.playerData.level >= 5 ? (
                           <Button size="sm" variant="secondary" onClick={() => console.log('Study Track clicked', entry)}>
                             Study Track
                           </Button>
                        ) : (
                           <Button size="sm" variant="secondary" disabled>
                             Study Track (Req. Level 5)
                           </Button>
                        )}
                      </div>
                    </div>
                  )}
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
                className="p-2 bg-gray-700/50 rounded text-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getGenreEmoji(trend.genre)}</span>
                  <span className="capitalize text-gray-300">{trend.genre}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium">{trend.popularity}%</span>
                  <span className={trend.growth > 0 ? 'text-green-400' : trend.growth < 0 ? 'text-red-400' : 'text-gray-400'}>
                    {trend.growth > 0 ? '↗' : trend.growth < 0 ? '↘' : '→'}
                  </span>
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
