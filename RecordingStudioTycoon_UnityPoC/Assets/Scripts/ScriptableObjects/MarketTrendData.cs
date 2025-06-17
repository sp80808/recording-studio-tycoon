using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "MarketTrendData", menuName = "Recording Studio Tycoon/Market Trend Data")]
    public class MarketTrendData : ScriptableObject
    {
        public SerializableDictionary<string, float> marketTrends;
    }
} 