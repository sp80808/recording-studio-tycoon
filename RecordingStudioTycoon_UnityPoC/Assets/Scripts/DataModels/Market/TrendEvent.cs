using System;
using RecordingStudioTycoon.DataModels.Market;

namespace RecordingStudioTycoon.DataModels.Market
{
    [Serializable]
    public class TrendEvent
    {
        public string Id;
        public string Name;
        public string Description;
        public float Impact; // Positive or negative impact on popularity/growth
        public MusicGenre[] AffectedGenres;
        public int DurationDays;
        public int StartDay;
    }
}