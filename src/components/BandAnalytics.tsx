import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Band } from '@/types/bands';
import { useBandPerformance } from '@/hooks/useBandPerformance';
import { useBandReputation } from '@/hooks/useBandReputation';
import { useBandRewards } from '@/hooks/useBandRewards';
import { useGameState } from '@/hooks/useGameState';
import { formatDate } from '@/utils/dateUtils';

interface BandAnalyticsProps {
  band: Band;
}

export const BandAnalytics: React.FC<BandAnalyticsProps> = ({ band }) => {
  const { gameState, updateGameState } = useGameState();
  const { calculateBandPerformance } = useBandPerformance();
  const { getReputationLevel, getReputationProgress } = useBandReputation({
    gameState,
    setGameState: updateGameState
  });
  const { getRewardMultipliers } = useBandRewards({
    gameState,
    setGameState: updateGameState
  });

  // Calculate average performance metrics
  const averagePerformance = band.performanceHistory.reduce(
    (acc: { overall: number; technical: number; creativity: number; stagePresence: number; genreMatch: number; count: number }, entry: PerformanceHistoryEntry) => ({
      overall: acc.overall + entry.rating.overall,
      technical: acc.technical + entry.rating.technical,
      creativity: acc.creativity + entry.rating.creativity,
      stagePresence: acc.stagePresence + entry.rating.stagePresence,
      genreMatch: acc.genreMatch + entry.rating.genreMatch,
      count: acc.count + 1
    }),
    { overall: 0, technical: 0, creativity: 0, stagePresence: 0, genreMatch: 0, count: 0 }
  );

  const avgOverall = averagePerformance.count > 0 ? averagePerformance.overall / averagePerformance.count : 0;
  const avgTechnical = averagePerformance.count > 0 ? averagePerformance.technical / averagePerformance.count : 0;
  const avgCreativity = averagePerformance.count > 0 ? averagePerformance.creativity / averagePerformance.count : 0;
  const avgStagePresence = averagePerformance.count > 0 ? averagePerformance.stagePresence / averagePerformance.count : 0;
  const avgGenreMatch = averagePerformance.count > 0 ? averagePerformance.genreMatch / averagePerformance.count : 0;

  // Calculate trend data
  const recentPerformances = band.performanceHistory.slice(-5);
  const performanceTrend = recentPerformances.map((entry: PerformanceHistoryEntry) => entry.rating.overall);
  const isImproving = performanceTrend.length >= 2 && 
    performanceTrend[performanceTrend.length - 1] > performanceTrend[0];

  // Calculate genre performance
  const genrePerformance = band.performanceHistory.reduce((acc: Record<string, { total: number; count: number }>, entry: PerformanceHistoryEntry) => {
    const genre = band.genre;
    if (!acc[genre]) {
      acc[genre] = { total: 0, count: 0 };
    }
    acc[genre].total += entry.rating.genreMatch;
    acc[genre].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const avgGenrePerformance = Object.entries(genrePerformance).map(([genre, data]) => ({
    genre,
    average: data.total / data.count
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Reputation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getReputationLevel(band.reputation)}</div>
                  <p className="text-xs text-muted-foreground">
                    {band.reputation} reputation points
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isImproving ? '↑ Improving' : '→ Stable'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last 5 performances
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall</span>
                    <span>{avgOverall.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technical</span>
                    <span>{avgTechnical.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creativity</span>
                    <span>{avgCreativity.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stage Presence</span>
                    <span>{avgStagePresence.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Genre Match</span>
                    <span>{avgGenreMatch.toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {band.performanceHistory.slice(-3).reverse().map((entry: PerformanceHistoryEntry, index: number) => (
                    <div key={index} className="p-2 border rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{formatDate(new Date(entry.date))}</span>
                        <span className="text-sm text-green-500">
                          +{entry.reputationGain} rep
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Genre Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {avgGenrePerformance.map(({ genre, average }) => (
                    <div key={genre} className="flex justify-between">
                      <span>{genre}</span>
                      <span>{average.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 