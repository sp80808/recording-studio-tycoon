import { useState, useEffect } from 'react';
import { Chart, MarketTrend } from '@/types/charts';
import { GameState } from '@/types/game';
import { generateCharts, generateMarketTrends } from '@/data/chartsData';

export interface ChartPanelData {
  availableCharts: Chart[];
  selectedChart: string;
  setSelectedChart: React.Dispatch<React.SetStateAction<string>>;
  marketTrends: MarketTrend[];
  currentChartInstance: Chart | undefined;
}

export const useChartPanelData = (gameState: GameState): ChartPanelData => {
  const [availableCharts, setAvailableCharts] = useState<Chart[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>('hot100');
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);

  useEffect(() => {
    const charts = generateCharts(gameState.playerData.level, gameState.currentEra);
    const accessibleCharts = charts.filter(chart => chart.minLevelToAccess <= gameState.playerData.level);
    setAvailableCharts(accessibleCharts);

    if (!accessibleCharts.find(c => c.id === selectedChart) && accessibleCharts.length > 0) {
      setSelectedChart(accessibleCharts[0].id);
    } else if (accessibleCharts.length === 0) {
        // Handle case where no charts are accessible, perhaps set to a default or leave as is
        // For now, if no charts are accessible, selectedChart might remain on a non-existent chart ID
        // or an empty string if no default was ever set.
        // Consider setting to a specific "no charts available" ID or empty string.
        setSelectedChart(''); 
    }
  }, [gameState.playerData.level, gameState.currentEra, selectedChart]); // selectedChart dependency to re-evaluate if it becomes invalid

  useEffect(() => {
    setMarketTrends(generateMarketTrends());
  }, []); // Assuming market trends don't depend on gameState for now

  const currentChartInstance = availableCharts.find(chart => chart.id === selectedChart);

  return {
    availableCharts,
    selectedChart,
    setSelectedChart,
    marketTrends,
    currentChartInstance,
  };
};
