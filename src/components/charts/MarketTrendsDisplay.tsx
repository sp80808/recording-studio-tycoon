import React from 'react';
import { Card } from '@/components/ui/card';
import { MarketTrend } from '@/types/charts';

interface MarketTrendsDisplayProps {
  marketTrends: MarketTrend[];
  getGenreEmoji: (genre: string) => string;
}

export const MarketTrendsDisplay: React.FC<MarketTrendsDisplayProps> = ({
  marketTrends,
  getGenreEmoji,
}) => {
  return (
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
  );
};
