
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GameState } from '@/types/game';
import { Chart, ArtistContact } from '@/types/charts';
import { generateCharts, generateMarketTrends } from '@/data/chartsData';
import { toast } from '@/hooks/use-toast';
import { ArtistContactModal } from './modals/ArtistContactModal';

interface EnhancedChartsPanelProps {
  gameState: GameState;
  onContactArtist: (artistId: string, offer: number) => void;
}

export const EnhancedChartsPanel: React.FC<EnhancedChartsPanelProps> = ({
  gameState,
  onContactArtist
}) => {
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Initialize charts data if not present
  useEffect(() => {
    if (!gameState.chartsData) {
      // This should be handled by the parent component
      console.log('Charts data not initialized');
    }
  }, [gameState.chartsData]);

  const charts = gameState.chartsData?.charts || generateCharts(gameState.playerData?.level || 1, gameState.currentEra);
  const marketTrends = gameState.chartsData?.marketTrends || generateMarketTrends();
  const discoveredArtists = gameState.chartsData?.discoveredArtists || [];
  const contactedArtists = gameState.chartsData?.contactedArtists || [];

  // Calculate unlock progress
  const projectsCompleted = gameState.playerData?.completedProjects || 0;
  const chartsUnlocked = projectsCompleted >= 3;
  const trendsUnlocked = projectsCompleted >= 5;
  const artistContactUnlocked = projectsCompleted >= 8;

  const handleContactArtist = (artist: any) => {
    if (!artistContactUnlocked) {
      toast({
        title: "Feature Locked",
        description: "Complete 8 projects to unlock artist contact feature.",
        variant: "destructive"
      });
      return;
    }

    // Check if already contacted
    const alreadyContacted = contactedArtists.some(contact => contact.artistId === artist.id);
    if (alreadyContacted) {
      toast({
        title: "Already Contacted",
        description: "You have already contacted this artist.",
        variant: "destructive"
      });
      return;
    }

    setSelectedArtist(artist);
    setShowContactModal(true);
  };

  const handleSubmitContact = (offer: number) => {
    if (selectedArtist) {
      onContactArtist(selectedArtist.id, offer);
      setShowContactModal(false);
      setSelectedArtist(null);
    }
  };

  if (!chartsUnlocked) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-600">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-white mb-2">Charts Locked</h3>
          <p className="text-gray-400 mb-4">Complete 3 projects to unlock the charts system</p>
          <Progress value={(projectsCompleted / 3) * 100} className="w-full" />
          <p className="text-sm text-gray-500 mt-2">{projectsCompleted}/3 projects completed</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Charts */}
      <Card className="p-4 bg-gray-800/50 border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Current Charts</h3>
        <div className="space-y-3">
          {charts.slice(0, 5).map((chart, index) => (
            <div key={chart.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 font-bold text-lg">#{index + 1}</span>
                <div>
                  <div className="text-white font-medium">{chart.name}</div>
                  <div className="text-gray-400 text-sm">{chart.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-semibold">{chart.influence}%</div>
                <div className="text-gray-400 text-sm">{chart.region}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Market Trends */}
      {trendsUnlocked && (
        <Card className="p-4 bg-gray-800/50 border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Market Trends</h3>
          <div className="space-y-3">
            {marketTrends.slice(0, 3).map((trend) => (
              <div key={trend.genre} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{trend.genre}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    trend.growth > 0 ? 'bg-green-600 text-green-100' :
                    trend.growth < 0 ? 'bg-red-600 text-red-100' :
                    'bg-yellow-600 text-yellow-100'
                  }`}>
                    {trend.growth > 0 ? '📈' : trend.growth < 0 ? '📉' : '➡️'} {trend.growth > 0 ? 'rising' : trend.growth < 0 ? 'falling' : 'stable'}
                  </span>
                </div>
                <div className="text-blue-400 text-sm mt-1">
                  Popularity: {trend.popularity}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Artist Discovery */}
      {artistContactUnlocked && discoveredArtists.length > 0 && (
        <Card className="p-4 bg-gray-800/50 border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">🎤 Discovered Artists</h3>
          <div className="space-y-3">
            {discoveredArtists.slice(0, 4).map((artist) => {
              const alreadyContacted = contactedArtists.some(contact => contact.artistId === artist.id);
              return (
                <div key={artist.id} className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{artist.name}</div>
                      <div className="text-gray-400 text-sm">{artist.genre} • Demand: {artist.demandLevel}%</div>
                      <div className="text-blue-400 text-sm">
                        Price range: ${artist.priceRange.min.toLocaleString()} - ${artist.priceRange.max.toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleContactArtist(artist)}
                      disabled={alreadyContacted}
                      className={alreadyContacted ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                      {alreadyContacted ? 'Contacted' : 'Contact'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Artist Contact Modal */}
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
    </div>
  );
};
