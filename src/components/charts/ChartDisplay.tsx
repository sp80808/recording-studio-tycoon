import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartEntry, Chart } from '@/types/charts';
import { GameState } from '@/types/game';
import { Play, Pause, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { calculateContactCost, isArtistContactable } from '@/data/chartsData';

interface ChartDisplayProps {
  chart: Chart;
  gameState: GameState;
  onContactArtist: (entry: ChartEntry) => void;
  currentlyPlaying: string | null;
  playbackProgress: { [key: string]: number };
  playAudioClip: (entry: ChartEntry) => void;
  getAudioClip: (entry: ChartEntry) => string | null;
  getPlaybackSegment: (entry: ChartEntry) => { startTime: number, endTime: number, segmentNumber: number, displayTime: string };
  getGenreEmoji: (genre: string) => string;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  chart,
  gameState,
  onContactArtist,
  currentlyPlaying,
  playbackProgress,
  playAudioClip,
  getAudioClip,
  getPlaybackSegment,
  getGenreEmoji,
}) => {

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

  return (
    <Card className="bg-gray-800/50 border-gray-600 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">{chart.name}</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {chart.region}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Updates weekly
          </Badge>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{chart.description}</p>

      {/* Chart Entries - Enhanced Layout like Billboard */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {chart.entries.slice(0, 20).map((entry, index) => {
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
              className="p-3 bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Chart Position & Movement */}
                <div className="flex items-center gap-2 min-w-[80px]">
                  <div className="text-xl font-bold text-white">{entry.position}.</div>
                  <div className={`text-sm flex items-center gap-1 ${getMovementColor(entry.movement)}`}>
                    {getMovementIcon(entry.movement)}
                    {entry.positionChange !== 0 && (
                      <span className="text-xs font-medium">
                        {Math.abs(entry.positionChange)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Song & Artist Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-white truncate">
                    {entry.song.title}
                  </h4>
                  <p className="text-sm text-gray-300 truncate">
                    {entry.song.artist.name}
                  </p>
                </div>

                {/* Genre, Weeks, Peak */}
                <div className="flex items-center gap-3 text-xs text-gray-500 min-w-[150px] justify-end">
                   <Badge variant="outline" className="text-xs px-2 py-0 capitalize flex items-center gap-1">
                      {getGenreEmoji(entry.song.genre)} {entry.song.genre}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{entry.weeksOnChart}w</span>
                    </div>
                    {entry.peakPosition !== entry.position && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Peak #{entry.peakPosition}</span>
                      </div>
                    )}
                </div>

                {/* Audio Control */}
                <div className="flex flex-col items-center gap-2 min-w-[60px]">
                   <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playAudioClip(entry)}
                    disabled={!hasAudio}
                    className={`h-8 w-8 rounded-full p-0 transition-all relative ${
                      isPlaying
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg animate-pulse'
                        : hasAudio
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                    title={hasAudio ? `Play preview: ${segment.displayTime}` : 'No preview available'}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                     {hasAudio && !isPlaying && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full text-[8px] flex items-center justify-center font-bold text-white">
                        {segment.segmentNumber}
                      </div>
                    )}
                  </Button>
                   {hasAudio && (progress > 0 || isPlaying) && (
                    <div className="w-8 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          isPlaying ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Contact Button */}
                <div className="min-w-[100px] text-right">
                  {canContact && (
                    <Button
                      size="sm"
                      onClick={() => onContactArtist(entry)}
                      disabled={!canAfford}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs px-3"
                    >
                      Contact
                    </Button>
                  )}
                   {!canContact && (
                      <div className="text-red-400 text-xs mt-1">
                        {entry.position <= 10 ? 'Req. Level 8+' :
                          entry.position <= 25 ? 'Req. Level 5+' : 'Req. Reputation'}
                      </div>
                    )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
