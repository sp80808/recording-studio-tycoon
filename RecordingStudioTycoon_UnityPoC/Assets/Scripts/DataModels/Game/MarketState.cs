using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Market;

namespace RecordingStudioTycoon.DataModels.Game
{
    [Serializable]
    public class MarketState
    {
        public List<MarketTrend> CurrentTrends;
        public List<MarketTrend> HistoricalTrends; // To store historical data if needed
        public List<ChartEntry> CurrentHot100Chart; // Example chart
        public List<ChartEntry> CurrentGenreCharts; // Other genre-specific charts

        public MarketState()
        {
            CurrentTrends = new List<MarketTrend>();
            HistoricalTrends = new List<MarketTrend>();
            CurrentHot100Chart = new List<ChartEntry>();
            CurrentGenreCharts = new List<ChartEntry>();
        }
    }
}