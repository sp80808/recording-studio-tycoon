using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Market;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "MarketTrendsData", menuName = "ScriptableObjects/Market Trends Data")]
    public class MarketTrendsDataSO : ScriptableObject
    {
        public List<MarketTrend> InitialMarketTrends;
        public List<SubGenre> AllSubGenres;
    }
}