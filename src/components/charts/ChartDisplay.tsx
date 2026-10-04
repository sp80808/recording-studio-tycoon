import React from 'react';
import { Button } from '@/components/ui/button';
import { ChartEntry, Chart } from '@/types/charts';
import { GameState } from '@/types/game';
import { Play, Pause, TrendingUp, Clock, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { HoverPreview } from '@/components/HoverPreview';

interface ChartDisplayProps {
  chart: Chart;
  gameState: GameState;
  onContactArtist: (entry: ChartEntry) => void;
  currentlyPlaying: string | null;
  playbackProgress: { [key: string]: number };
  playAudioClip: (entry: ChartEntry) => void;
  getAudioClip: (entry: ChartEntry) => string | null;
  getPlaybackSegment: (entry: ChartEntry) => { startTime: number, endTime: number, segmentNumber: number, displayTime: string };
  getGenreEmoji: (genre: string) => React.ReactNode;
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
      case 'up': return <ArrowUp className="h-3 w-3" aria-hidden="true" />;
      case 'down': return <ArrowDown className="h-3 w-3" aria-hidden="true" />;
      case 'new': return <span className="chart-entry__new">New</span>;
      default: return <Minus className="h-3 w-3" aria-hidden="true" />;
    }
  };

  const getMovementLabel = (entry: ChartEntry) => {
    if (entry.movement === 'new') return 'New chart entry';
    if (entry.movement === 'returning') return 'Returning chart entry';
    if (entry.movement === 'steady') return 'No change';
    return `${entry.movement === 'up' ? 'Up' : 'Down'} ${Math.abs(entry.positionChange)} places`;
  };

  const getMovementColor = (movement: ChartEntry['movement']) => {
    switch (movement) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'new': return 'text-amber-300';
      default: return 'text-stone-400';
    }
  };

  return (
    <section className="chart-board" aria-label={`${chart.name} chart`}>
      <header className="chart-board__header">
        <div>
          <span className="chart-board__issue">Current issue · Top 20</span>
          <h4>{chart.name}</h4>
          <p>{chart.description}</p>
        </div>
        <div className="chart-board__badges" aria-label="Chart details">
          <span>{chart.region}</span>
          <span>Weekly</span>
        </div>
      </header>

      <div className="chart-board__entries">
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
            <article
              key={trackId}
              className={`chart-entry ${index === 0 ? 'chart-entry--number-one' : ''}`}
            >
                <div className="chart-entry__rank">
                  <strong>{entry.position}</strong>
                  <div className={`chart-entry__movement ${getMovementColor(entry.movement)}`} aria-label={getMovementLabel(entry)}>
                    {getMovementIcon(entry.movement)}
                    {entry.positionChange !== 0 && (
                      <span className="text-xs font-medium">
                        {Math.abs(entry.positionChange)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="chart-entry__art" aria-hidden="true">
                  <span>{entry.song.artist.name.slice(0, 1)}</span>
                </div>

                <div className="chart-entry__identity">
                  <HoverPreview
                    preview={
                      <span>
                        <strong>{entry.song.title}</strong> — {entry.song.artist.name}<br />
                        {entry.song.genre} · {entry.weeksOnChart}w on chart · Peak #{entry.peakPosition}
                      </span>
                    }
                  >
                    <h5>
                      {entry.song.title}
                    </h5>
                  </HoverPreview>
                  <p>{entry.song.artist.name}</p>
                </div>

                <div className="chart-entry__metadata">
                   <span className="chart-entry__genre">
                      {getGenreEmoji(entry.song.genre)} {entry.song.genre}
                    </span>
                    <span aria-label={`${entry.weeksOnChart} ${entry.weeksOnChart === 1 ? 'week' : 'weeks'} on chart`}>
                      <Clock className="h-3 w-3" />
                      <span aria-hidden="true">{entry.weeksOnChart}w</span>
                    </span>
                    {entry.peakPosition !== entry.position && (
                      <span>
                        <TrendingUp className="h-3 w-3" />
                        <span>Peak #{entry.peakPosition}</span>
                      </span>
                    )}
                </div>

                <div className="chart-entry__preview">
                   <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playAudioClip(entry)}
                    disabled={!hasAudio}
                    aria-label={`${isPlaying ? 'Pause' : 'Play'} preview: ${entry.song.title} by ${entry.song.artist.name}`}
                    aria-pressed={isPlaying}
                    className={`chart-entry__play ${
                      isPlaying
                        ? 'bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24] text-emerald-100 shadow-lg animate-pulse'
                        : hasAudio
                          ? 'bg-white/[0.07] ring-1 ring-inset ring-white/15 hover:bg-white/[0.13] text-stone-200'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                    title={hasAudio ? `Play preview: ${segment.displayTime}` : 'No preview available'}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                     {hasAudio && !isPlaying && (
                      <span className="chart-entry__segment">
                        {segment.segmentNumber}
                      </span>
                    )}
                  </Button>
                   {hasAudio && (progress > 0 || isPlaying) && (
                    <div className="chart-entry__progress">
                      <div
                        className={`h-full transition-all duration-75 ${
                          isPlaying ? 'bg-green-400' : 'bg-stone-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="chart-entry__action">
                  {canContact && (
                    <Button
                      size="sm"
                      onClick={() => onContactArtist(entry)}
                      disabled={!canAfford}
                      className="chart-entry__contact"
                    >
                      Contact
                    </Button>
                  )}
                   {!canContact && (
                      <div className="chart-entry__requirement">
                        {entry.position <= 10 ? 'Req. Level 8+' :
                          entry.position <= 25 ? 'Req. Level 5+' : 'Req. Reputation'}
                      </div>
                    )}
                </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
