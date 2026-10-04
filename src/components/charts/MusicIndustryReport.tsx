import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, MinusCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { MarketTrend, TrendDirection } from '@/types/charts'; // Removed MusicGenre, SubGenre
import { marketService, marketTrendsAt } from '@/services/marketService';

interface MusicIndustryReportProps {
  /** Save seed and in-game day: when given, the report shows that save's derived market. */
  seed?: string | number;
  day?: number;
}

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  switch (direction) {
    case 'rising': return <ArrowUp className="h-4 w-4 text-green-500" />;
    case 'falling': return <ArrowDown className="h-4 w-4 text-red-500" />;
    case 'stable': return <MinusCircle className="h-4 w-4 text-yellow-500" />;
    case 'emerging': return <TrendingUp className="h-4 w-4 text-amber-400" />;
    case 'fading': return <TrendingDown className="h-4 w-4 text-stone-500" />;
    default: return <AlertCircle className="h-4 w-4 text-stone-400" />;
  }
};

export const MusicIndustryReport: React.FC<MusicIndustryReportProps> = ({ seed, day }) => {
  const allTrends = React.useMemo(
    () => (seed !== undefined && day !== undefined ? marketTrendsAt(seed, day) : marketService.getAllTrends()),
    [seed, day],
  );
  const isLoading = false; // TODO: Add loading state
  const error = null; // TODO: Add error handling

  if (isLoading) {
    return <div className="p-4">Loading market report...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading market report: {error}</div>;
  }

  if (!allTrends || allTrends.length === 0) {
    return <div className="p-4">No market trend data available.</div>;
  }

  return (
    <Card className="w-full shadow-lg bg-stone-800 text-stone-100 border-stone-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-400">Music Industry Report</CardTitle>
        <CardDescription className="text-stone-400">Current market trends and genre popularity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-stone-700 hover:bg-stone-700/30">
              <TableHead className="text-stone-300">Genre</TableHead>
              <TableHead className="text-stone-300">SubGenre</TableHead>
              <TableHead className="text-stone-300 text-right">Popularity</TableHead>
              <TableHead className="text-stone-300 text-center">Trend</TableHead>
              <TableHead className="text-stone-300 text-right">Growth Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTrends.map((trend) => {
              const subGenre = trend.subGenreId ? marketService.getSubGenreById(trend.subGenreId) : null;
              return (
                <TableRow key={trend.id} className="border-stone-700 hover:bg-stone-700/30">
                  <TableCell className="font-medium capitalize text-stone-200">{trend.genreId}</TableCell>
                  <TableCell className="capitalize text-stone-400">{subGenre ? subGenre.name : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={trend.popularity > 70 ? "default" : trend.popularity > 40 ? "secondary" : "outline"}
                           className={
                             trend.popularity > 70 ? "bg-green-500/20 text-green-400 border-green-500" :
                             trend.popularity > 40 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500" :
                             "bg-red-500/20 text-red-400 border-red-500"
                           }>
                      {trend.popularity}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center flex justify-center items-center">
                    <TrendIcon direction={trend.trendDirection} />
                    <span className="ml-1 capitalize text-xs hidden md:inline">{trend.trendDirection}</span>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    trend.growthRate > 0 ? 'text-green-400' : trend.growthRate < 0 ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
