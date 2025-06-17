using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Market
{
    [Serializable]
    public class MarketState
    {
        public SerializableDictionary<MusicGenre, float> genrePopularity;
        public SerializableDictionary<string, float> trendInfluence;
        public List<TrendEvent> activeTrends;
        public float overallMarketHealth;
        public int currentWeek;

        public MarketState()
        {
            genrePopularity = new SerializableDictionary<MusicGenre, float>();
            trendInfluence = new SerializableDictionary<string, float>();
            activeTrends = new List<TrendEvent>();
            overallMarketHealth = 1.0f;
            currentWeek = 1;

            // Initialize genre popularity
            foreach (MusicGenre genre in Enum.GetValues(typeof(MusicGenre)))
            {
                genrePopularity[genre] = 0.5f; // Start at neutral popularity
            }
        }
    }

    [Serializable]
    public class TrendEvent
    {
        public string id;
        public string name;
        public string description;
        public MusicGenre affectedGenre;
        public float impact;
        public int startWeek;
        public int duration;
        public bool isActive;

        public TrendEvent()
        {
            id = Guid.NewGuid().ToString();
            isActive = false;
        }
    }
}
