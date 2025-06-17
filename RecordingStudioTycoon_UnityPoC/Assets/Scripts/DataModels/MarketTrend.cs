using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    public enum TrendDirection
    {
        Rising,
        Stable,
        Falling,
        Emerging,
        Fading
    }

    [System.Serializable]
    public class MarketTrend
    {
        public string Id;
        public string GenreId; // Corresponds to MusicGenre in TS
        public string SubGenreId; // Optional
        public float Popularity; // 0-100
        public TrendDirection Direction;
        public float GrowthRate; // % change per update period
        public long LastUpdatedDay; // Game day
        public int Growth; // For compatibility, can be derived from GrowthRate
        public int Duration; // Default duration for a trend phase
        public int StartDay;
        public int ProjectedDuration;
        public List<float> Seasonality; // Array of 12 floats for monthly modifiers

        public MarketTrend()
        {
            Id = Guid.NewGuid().ToString();
            GenreId = "pop"; // Default
            SubGenreId = null;
            Popularity = 50f;
            Direction = TrendDirection.Stable;
            GrowthRate = 0f;
            LastUpdatedDay = 0;
            Growth = 0;
            Duration = 90;
            StartDay = 1;
            ProjectedDuration = 90;
            Seasonality = new List<float> { 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f };
        }

        public MarketTrend(string genreId, string subGenreId = null, float popularity = 50f, TrendDirection direction = TrendDirection.Stable, float growthRate = 0f, long lastUpdatedDay = 0, int duration = 90, int startDay = 1, int projectedDuration = 90)
        {
            Id = Guid.NewGuid().ToString();
            GenreId = genreId;
            SubGenreId = subGenreId;
            Popularity = popularity;
            Direction = direction;
            GrowthRate = growthRate;
            LastUpdatedDay = lastUpdatedDay;
            Growth = (int)Math.Round(growthRate * 10);
            Duration = duration;
            StartDay = startDay;
            ProjectedDuration = projectedDuration;
            Seasonality = new List<float> { 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f };
        }
    }
}