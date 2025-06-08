import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chart, ChartEntry, MarketTrend } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends, calculateContactCost, isArtistContactable } from '@/data/chartsData';
import { ArtistContactModal } from './modals/ArtistContactModal';

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
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentChart.entries.slice(0, 20).map((entry, index) => {
              const contactCost = calculateContactCost(
                entry.position,
                entry.song.artist.popularity,
                gameState.playerData.reputation
              );
              const canContact = isArtistContactable(entry, gameState.playerData.level, gameState.playerData.reputation);
              const canAfford = gameState.money >= contactCost;

              return (
                <div
                  key={`${entry.song.id}-${entry.position}`}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-lg font-bold text-white w-8">
                      {entry.position}
                    </div>

                    <div className={`text-lg ${getMovementColor(entry.movement)}`}>
                      {getMovementIcon(entry.movement)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">
                        {entry.song.title}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {entry.song.artist.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {entry.song.artist.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{entry.song.genre}</span>
                        <span>•</span>
                        <span>{entry.weeksOnChart} weeks on chart</span>
                        {entry.peakPosition !== entry.position && (
                          <>
                            <span>•</span>
                            <span>Peak: #{entry.peakPosition}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <div className="flex flex-col items-end gap-1">
                    {canContact && (
                      <Button
                        size="sm"
                        onClick={() => handleContactArtist(entry)}
                        disabled={!canAfford}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        Contact
                      </Button>
                    )}
                    <div className="text-xs text-gray-400">
                      ${contactCost.toLocaleString()}
                    </div>
                    {!canContact && (
                      <div className="text-xs text-red-400">
                        {entry.position <= 10 ? 'Req. Level 8+' :
                          entry.position <= 25 ? 'Req. Level 5+' : 'Req. Reputation'}
                      </div>
                    )}
                  </div>
                </div>
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
