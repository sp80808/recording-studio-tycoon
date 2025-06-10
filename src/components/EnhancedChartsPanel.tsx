
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Chart, ChartEntry, MarketTrend, Artist } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends, calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { ArtistContactModal } from './modals/ArtistContactModal';
import { Play, Pause, Volume2, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus, Music, Users, Award, Globe } from 'lucide-react';

interface EnhancedChartsPanelProps {
  gameState: GameState;
  onContactArtist: (artistId: string, offer: number) => void;
}

export const EnhancedChartsPanel: React.FC<EnhancedChartsPanelProps> = ({ gameState, onContactArtist }) => {
  const [availableCharts, setAvailableCharts] = useState<Chart[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>('hot100');
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ChartEntry | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [key: string]: number }>({});
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [playerInfluence, setPlayerInfluence] = useState(0);
  const [chartHistory, setChartHistory] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced genre emoji mapping
  const getGenreEmoji = (genre: string) => {
    const emojiMap: { [key: string]: string } = {
      'pop': '🎵', 'rock': '🎸', 'hip-hop': '🎤', 'electronic': '🎛️',
      'jazz': '🎺', 'classical': '🎼', 'country': '🤠', 'r&b': '🎶',
      'reggae': '🌴', 'folk': '🪕', 'blues': '🎷', 'punk': '⚡',
      'metal': '🔥', 'indie': '🎭', 'alternative': '🌟', 'funk': '🕺'
    };
    return emojiMap[genre.toLowerCase()] || '🎵';
  };

  // Calculate player industry influence
  useEffect(() => {
    const influence = Math.min(
      (gameState.playerData.reputation || 0) / 10 + 
      (gameState.playerData.level * 2) + 
      (gameState.completedProjects?.length || 0),
      100
    );
    setPlayerInfluence(influence);
  }, [gameState]);

  // Enhanced audio clip system
  const getAudioClip = (entry: ChartEntry): string | null => {
    const genre = entry.song.genre.toLowerCase();
    const audioMap: { [key: string]: string[] } = {
      'rock': ['60s-chart-track5.mp3', '80s-Power-Chord1.mp3', '80s-Power-Chord2.mp3'],
      'pop': ['60s-Pop2.mp3', '80schart-anthem1.mp3', '00sStreaming-Ready1.mp3'],
      'electronic': ['80s-Synthesizer1.mp3', '2000s-Electronic1.mp3', '00sElectronic-Hybrid2.mp3'],
      'hip-hop': ['80s-Power-Chord2.mp3', '00sNu-Metal-Vibe2.mp3', '00s-rnb3.mp3'],
      'r&b': ['00s-rnb1.mp3', '00s-rnb2.mp3', '00s-rnb3.mp3'],
      'country': ['2000s-Country3.mp3', '60s-chart-track5.mp3']
    };

    const clips = audioMap[genre] || audioMap['pop'];
    if (clips && clips.length > 0) {
      const seed = entry.position + entry.song.artist.popularity;
      return clips[seed % clips.length];
    }
    return null;
  };

  // Enhanced playback system
  const playAudioClip = async (entry: ChartEntry) => {
    const clipName = getAudioClip(entry);
    if (!clipName) return;

    const trackId = `${entry.song.id}-${entry.position}`;
    
    if (audioRef.current) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
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
        audio.currentTime = 0;
        setCurrentlyPlaying(trackId);
        audio.play();

        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime && audio.duration && !audio.paused) {
            const progress = (audio.currentTime / Math.min(audio.duration, 25)) * 100;
            setPlaybackProgress(prev => ({ ...prev, [trackId]: progress }));

            if (audio.currentTime >= 25 || audio.currentTime >= audio.duration - 0.5) {
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
      });

    } catch (error) {
      console.warn(`Audio playback error:`, error);
      setCurrentlyPlaying(null);
    }
  };

  // Generate charts based on player influence
  useEffect(() => {
    const charts = generateCharts(gameState.playerData.level, gameState.currentEra);
    const accessibleCharts = charts.filter(chart => chart.minLevelToAccess <= gameState.playerData.level);
    setAvailableCharts(accessibleCharts);

    if (!accessibleCharts.find(c => c.id === selectedChart)) {
      setSelectedChart(accessibleCharts[0]?.id || 'hot100');
    }
  }, [gameState.playerData.level, gameState.currentEra, selectedChart]);

  useEffect(() => {
    setMarketTrends(generateMarketTrends());
  }, []);

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
      case 'up': return <ArrowUp className="h-3 w-3 text-green-400" />;
      case 'down': return <ArrowDown className="h-3 w-3 text-red-400" />;
      case 'new': return <Badge variant="outline" className="text-xs px-1 py-0 text-blue-400 border-blue-400">NEW</Badge>;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
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
    <div className="space-y-6">
      {/* Header with industry influence */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            📈 Industry Charts
            {playerInfluence > 50 && <Star className="h-5 w-5 text-yellow-400" />}
          </h3>
          <p className="text-sm text-gray-400">
            Your Industry Influence: {Math.round(playerInfluence)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            Level {gameState.playerData.level}
          </Badge>
          {playerInfluence > 75 && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
              Industry Leader
            </Badge>
          )}
        </div>
      </div>

      {/* Enhanced Chart Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {availableCharts.map(chart => (
          <Button
            key={chart.id}
            onClick={() => setSelectedChart(chart.id)}
            variant={selectedChart === chart.id ? 'default' : 'outline'}
            size="sm"
            className={`text-xs p-2 h-auto flex flex-col gap-1 ${
              selectedChart === chart.id 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'hover:bg-gray-700'
            }`}
          >
            <div className="text-sm font-medium">{chart.name}</div>
            <div className="text-xs opacity-75">{chart.region}</div>
          </Button>
        ))}
      </div>

      {/* Industry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-600 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Market Reach</span>
          </div>
          <Progress value={playerInfluence} className="h-2" />
          <div className="text-xs text-gray-400 mt-1">
            {playerInfluence > 75 ? 'Global' : playerInfluence > 50 ? 'National' : playerInfluence > 25 ? 'Regional' : 'Local'}
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-white">Artist Network</span>
          </div>
          <div className="text-lg font-bold text-white">
            {Math.floor(playerInfluence / 10)} contacts
          </div>
          <div className="text-xs text-gray-400">Available artists</div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Chart Success</span>
          </div>
          <div className="text-lg font-bold text-white">
            {chartHistory.length || 0}
          </div>
          <div className="text-xs text-gray-400">Charted songs</div>
        </Card>
      </div>

      {/* Enhanced Chart Display */}
      {currentChart && (
        <Card className="bg-gray-800/50 border-gray-600 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-white text-lg">{currentChart.name}</h4>
              <p className="text-sm text-gray-400">{currentChart.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentChart.region}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Updates weekly
              </Badge>
            </div>
          </div>

          {/* Chart Entries */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
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
                  className={`p-3 bg-gray-700/30 border-gray-600/50 transition-all duration-300 hover:bg-gray-700/50 hover:shadow-lg hover:border-blue-500/30 cursor-pointer ${
                    expandedEntryId === trackId ? 'ring-2 ring-blue-500 bg-gray-700/60' : ''
                  }`}
                  onClick={() => setExpandedEntryId(expandedEntryId === trackId ? null : trackId)}
                >
                  <div className="flex items-center gap-4">
                    {/* Chart Position */}
                    <div className="flex items-center min-w-[60px]">
                      <span className="text-2xl font-bold text-white mr-2">{entry.position}</span>
                      {getMovementIcon(entry.movement)}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                        {entry.song.title}
                      </h4>
                      <p className="text-sm text-gray-300 truncate flex items-center gap-2">
                        {entry.song.artist.name}
                        <span className="text-xs">{getGenreEmoji(entry.song.genre)} {entry.song.genre}</span>
                      </p>
                    </div>

                    {/* Chart Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{entry.weeksOnChart}w</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>#{entry.peakPosition}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>{entry.song.artist.popularity}</span>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    {hasAudio && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); playAudioClip(entry); }}
                          className={`h-8 w-8 rounded-full p-0 transition-all duration-200 ${
                            isPlaying 
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                              : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                          }`}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        {progress > 0 && (
                          <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-400 transition-all duration-200"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedEntryId === trackId && (
                    <div className="mt-4 pt-4 border-t border-gray-600/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-semibold text-white mb-2">Artist Details</h5>
                          <div className="space-y-1 text-gray-300">
                            <p>Popularity: <span className="text-yellow-400">{entry.song.artist.popularity}/100</span></p>
                            <p>Peak Position: <span className="text-blue-400">#{entry.peakPosition}</span></p>
                            <p>Genre: <span className="text-purple-400">{entry.song.genre}</span></p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-white mb-2">Collaboration</h5>
                          {canContact ? (
                            <div className="space-y-2">
                              <p className="text-green-400">Available for contact</p>
                              <p className="text-gray-300">Cost: <span className="text-yellow-400">${contactCost.toLocaleString()}</span></p>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactArtist(entry);
                                }}
                                disabled={!canAfford}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {canAfford ? 'Contact Artist' : 'Insufficient Funds'}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-red-400">Not available for contact</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Enhanced Market Trends */}
      {marketTrends.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-600 p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Trends
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {marketTrends.slice(0, 6).map(trend => (
              <div
                key={trend.genre}
                className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getGenreEmoji(trend.genre)}</span>
                    <span className="capitalize text-gray-300 font-medium">{trend.genre}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={trend.popularity} className="flex-1 h-2" />
                  <div className="ml-2 flex items-center gap-1">
                    <span className="text-white font-medium text-sm">{trend.popularity}%</span>
                    <span className={`text-xs ${
                      trend.growth > 0 ? 'text-green-400' : 
                      trend.growth < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
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
        <Card className="bg-blue-900/20 border-blue-600/50 p-4">
          <div className="text-sm text-blue-300">
            <div className="font-semibold mb-2 flex items-center gap-2">
              🔓 Unlock More Features
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {gameState.playerData.level < 3 && <div>• Rock Charts at Level 3</div>}
              {gameState.playerData.level < 5 && <div>• Artist Management at Level 5</div>}
              {gameState.playerData.level < 8 && <div>• International Charts at Level 8</div>}
              {gameState.playerData.level < 10 && <div>• Industry Influence Tools at Level 10</div>}
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
