using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // For MusicGenre, TrendDirection

namespace RecordingStudioTycoon.DataModels
{
    [Serializable]
    public class MarketTrend
    {
        public string id;
        public MusicGenre genreId;
        public string subGenreId; // Optional, for specific sub-genres
        public float popularity; // 0-100
        public TrendDirection trendDirection;
        public float growthRate; // Percentage change per update period
        public int lastUpdatedDay; // Game day of last update
        public int growth; // For compatibility, can be derived
        public int duration; // Default duration for a trend phase
        public int startDay;
        public int projectedDuration;
        public List<float> seasonality; // Monthly seasonality multipliers
    }

    [Serializable]
    public class TrendEvent
    {
        public string name;
        public string description;
        public List<MusicGenre> affectedGenres;
        public float impact; // Positive or negative impact on popularity/growth
        public int durationDays;
        public int startDay;
    }

    [CreateAssetMenu(fileName = "NewMarketTrendData", menuName = "ScriptableObjects/Market Trend Data")]
    public class MarketTrendData : ScriptableObject
    {
        public List<MarketTrend> initialTrends;
        public List<TrendEvent> globalEvents; // Pre-defined global events
    }
}
