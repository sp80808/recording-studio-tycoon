using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;

[CreateAssetMenu(fileName = "MarketTrendData", menuName = "Game Data/Market Trend Data")]
public class MarketTrendData : ScriptableObject
{
    public List<MarketTrendPattern> TrendPatterns;
}

[System.Serializable]
public class MarketTrendPattern
{
    public string Id;
    public string Name;
    public string Description;
    public SerializableDictionary<string, float> GenreImpacts; // e.g., "Pop": 0.1, "Rock": -0.05
    public int DurationDays;
    public bool IsActive;
}
