using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "MarketTrendData", menuName = "RecordingStudioTycoon/MarketTrendData", order = 7)]
    public class MarketTrendData : ScriptableObject
    {
        public string TrendId;
        public string TrendName;
        public string Description;
        public float BaseImpact;
        public int DurationDays;
        public List<string> AffectedGenres;
        public List<string> AffectedSubGenres;
        public int UnlockLevel;
        public bool IsUnlocked;
        public float Probability; // 0-1, chance of this trend occurring
        
        public MarketTrendData()
        {
            TrendId = "trend_popularity_boost";
            TrendName = "Popularity Boost";
            Description = "A sudden increase in popularity for specific music genres.";
            BaseImpact = 0.2f;
            DurationDays = 30;
            AffectedGenres = new List<string>();
            AffectedSubGenres = new List<string>();
            UnlockLevel = 1;
            IsUnlocked = false;
            Probability = 0.3f;
        }
    }
}
