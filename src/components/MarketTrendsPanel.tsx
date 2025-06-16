// Market Trends Panel Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, Minus, Eye, Info } from 'lucide-react';
import { useMarketTrends } from '../hooks/useMarketTrends';
import { MusicGenre } from '../types/charts';

interface MarketTrendsPanelProps {
  className?: string;
}

export const MarketTrendsPanel: React.FC<MarketTrendsPanelProps> = ({ className }) => {
  const {
    allTrends,
    marketAnalysis,
    playerImpact,
    getCurrentPopularity,
    getTrendDirection,
    getMarketInfluence,
    isLoading,
    error
  } = useMarketTrends();

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 80) return 'bg-green-500';
    if (popularity >= 60) return 'bg-yellow-500';
    if (popularity >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'rising':
        return 'border-green-200 bg-green-50';
      case 'falling':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Market Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading market data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Eye className="w-5 h-5" />
            Market Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Market Trends
        </CardTitle>
        <div className="text-sm text-gray-600">
          Industry Analysis & Genre Popularity
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Overview */}
        {marketAnalysis && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-green-700">Hot Trends</h4>
              {marketAnalysis.hotTrends.slice(0, 3).map((trend) => (
                <div key={trend.genreId} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{trend.genreId}</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    {trend.popularity}%
                  </Badge>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-red-700">Cold Trends</h4>
              {marketAnalysis.coldTrends.slice(0, 3).map((trend) => (
                <div key={trend.genreId} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{trend.genreId}</span>
                  <Badge variant="outline" className="text-red-600 border-red-300">
                    {trend.popularity}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genre Trends */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Genre Popularity</h4>
          <div className="space-y-3">
            {allTrends.slice(0, 6).map((trend) => (
              <div 
                key={`${trend.genreId}-${trend.subGenreId || 'main'}`}
                className={`p-3 rounded-lg border ${getTrendColor(trend.trendDirection)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize text-sm">
                      {trend.genreId}
                      {trend.subGenreId && (
                        <span className="text-gray-600 ml-1">({trend.subGenreId})</span>
                      )}
                    </span>
                    {getTrendIcon(trend.trendDirection)}
                  </div>
                  <Badge variant="outline">
                    {trend.popularity}%
                  </Badge>
                </div>
                <Progress 
                  value={trend.popularity} 
                  className={`h-2 ${getPopularityColor(trend.popularity)}`}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Market Share</span>
                  <span>Trend: {trend.trendDirection}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Market Influence */}
        {playerImpact.marketInfluence > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Your Market Influence
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Industry Influence</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {playerImpact.marketInfluence}%
                </Badge>
              </div>
              <Progress value={playerImpact.marketInfluence} className="h-2 bg-blue-200" />
              
              {playerImpact.trendSetting.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-blue-700 font-medium mb-1">Trends You're Setting:</div>
                  <div className="flex flex-wrap gap-1">
                    {playerImpact.trendSetting.map((trend, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-blue-600 border-blue-300">
                        {trend.subGenre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Insights */}
        {marketAnalysis?.emergingSubGenres && marketAnalysis.emergingSubGenres.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Emerging Opportunities</h4>
            <div className="space-y-2">
              {marketAnalysis.emergingSubGenres.slice(0, 2).map((genre, index) => (
                <div key={index} className="bg-purple-50 border border-purple-200 rounded p-2">
                  <div className="text-sm font-medium text-purple-800 capitalize">{genre}</div>
                  <div className="text-xs text-purple-600">New sub-genre gaining traction</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
