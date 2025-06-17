using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Market
{
    [System.Serializable]
    public class MarketTrend
    {
        public string Id;
        public string Name;
        public string Description;
        public float Influence;
        public int Duration;
        public int StartDay;
        public bool IsActive;
        public SerializableDictionary<string, float> Effects;

        public MarketTrend()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Trend";
            Description = "A new market trend.";
            Influence = 1.0f;
            Duration = 30;
            StartDay = 0;
            IsActive = false;
            Effects = new SerializableDictionary<string, float>();
        }
    }
}
