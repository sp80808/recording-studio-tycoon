using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class TrendEvent
    {
        public string Id;
        public string Name;
        public string Description;
        public float Impact; // Positive or negative impact on popularity/growth
        public List<string> AffectedGenres; // List of genre IDs
        public int DurationDays;
        public long StartDay;

        public TrendEvent()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Event";
            Description = "";
            Impact = 0f;
            AffectedGenres = new List<string>();
            DurationDays = 0;
            StartDay = 0;
        }

        public TrendEvent(string name, string description, float impact, List<string> affectedGenres, int durationDays, long startDay)
        {
            Id = Guid.NewGuid().ToString();
            Name = name;
            Description = description;
            Impact = impact;
            AffectedGenres = affectedGenres;
            DurationDays = durationDays;
            StartDay = startDay;
        }
    }
}