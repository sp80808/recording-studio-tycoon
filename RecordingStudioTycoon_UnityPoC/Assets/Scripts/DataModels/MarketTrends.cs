using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class MarketTrends
    {
        public SerializableDictionary<string, float> GenrePopularity;
        public SerializableDictionary<string, float> EraInfluence;
        public SerializableDictionary<string, float> CurrentTrendModifiers;

        public MarketTrends()
        {
            GenrePopularity = new SerializableDictionary<string, float>();
            EraInfluence = new SerializableDictionary<string, float>();
            CurrentTrendModifiers = new SerializableDictionary<string, float>();
        }
    }
}
