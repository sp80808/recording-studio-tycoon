using System;
using RecordingStudioTycoon.DataModels.Projects; // Assuming Project is in here
using RecordingStudioTycoon.DataModels.Game; // Assuming GameState is in here

namespace RecordingStudioTycoon.DataModels.Market
{
    [Serializable]
    public class MarketTrend
    {
        public string Id;
        public MusicGenre GenreId;
        public string SubGenreId; // Nullable in TS, string in C# for simplicity, can be empty
        public int Popularity; // 0-100
        public TrendDirection TrendDirection;
        public float GrowthRate; // % change per update period
        public int LastUpdatedDay; // Game day
        public int Growth; // Derived, can be removed or kept for compatibility
        public TrendEvent[] Events; // Active events affecting this trend
        public int Duration; // Duration of current trend phase
        public int StartDay; // Day when this trend phase started
        public int ProjectedDuration; // Projected total duration of this trend phase
        public float[] Seasonality; // Array of 12 floats for monthly seasonality multipliers
    }
}