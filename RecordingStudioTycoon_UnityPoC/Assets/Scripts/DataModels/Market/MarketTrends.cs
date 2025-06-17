using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Market
{
    [System.Serializable]
    public class MarketTrends
    {
        public string Id;
        public int CurrentDay;
        public SerializableDictionary<string, float> GenrePopularity;
        public SerializableDictionary<string, float> SubGenrePopularity;
        public List<TrendEvent> ActiveEvents;
        public List<TrendEvent> UpcomingEvents;

        public MarketTrends()
        {
            Id = Guid.NewGuid().ToString();
            CurrentDay = 0;
            GenrePopularity = new SerializableDictionary<string, float>();
            SubGenrePopularity = new SerializableDictionary<string, float>();
            ActiveEvents = new List<TrendEvent>();
            UpcomingEvents = new List<TrendEvent>();
        }
    }
}
