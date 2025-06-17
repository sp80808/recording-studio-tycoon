using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Market
{
    [System.Serializable]
    public class TrendEvent
    {
        public string Id;
        public string Name;
        public string Description;
        public int StartDay;
        public int Duration;
        public float Impact;
        public SerializableDictionary<string, float> Modifiers;

        public TrendEvent()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Trend Event";
            Description = "A new trend event in the market.";
            StartDay = 0;
            Duration = 14;
            Impact = 0.2f;
            Modifiers = new SerializableDictionary<string, float>();
        }
    }
}
