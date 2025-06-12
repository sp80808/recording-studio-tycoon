import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartEntry } from '@/types/charts';
import { GameState } from '@/types/game';
import { Play, Pause, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { calculateContactCost, isArtistContactable } from '@/data/chartsData';

interface ChartEntryRowProps {
  entry: ChartEntry;
  gameState: GameState;
  onContactArtist: (entry: ChartEntry) => void;
  currentlyPlaying: string | null;
  playbackProgress: { [key: string]: number };
  playAudioClip: (entry: ChartEntry) => void;
  getAudioClip: (entry: ChartEntry) => string | null;
  getPlaybackSegment: (entry: ChartEntry) => { startTime: number, endTime: number, segmentNumber: number, displayTime: string };
  getGenreEmoji: (genre: string) => string;
}

export const ChartEntryRow: React.FC<ChartEntryRowProps> = ({
  entry,
  gameState,
  onContactArtist,
  currentlyPlaying,
  playbackProgress,
  playAudioClip,
  getAudioClip,
  getPlaybackSegment,
  getGenreEmoji,
}) => {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const trackId = `${entry.song.id}-${entry.position}`;
  const isPlaying = currentlyPlaying === trackId;
  const hasAudio = getAudioClip(entry) !== null;
  const progress = playbackProgress[trackId] || 0;
  const segment = getPlaybackSegment(entry);

  const contactCost = calculateContactCost(
    entry.position,
    entry.song.artist.popularity,
    gameState.playerData.reputation
  );
  const canContact = isArtistContactable(entry, gameState.playerData.level, gameState.playerData.reputation);
  const canAfford = gameState.money >= contactCost;

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
};