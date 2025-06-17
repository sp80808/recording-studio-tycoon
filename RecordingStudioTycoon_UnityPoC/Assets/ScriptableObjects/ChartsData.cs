using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // For MusicGenre

namespace RecordingStudioTycoon.DataModels
{
    [Serializable]
    public class ChartEntry
    {
        public string id;
        public Song song; // Reference to the song data model
        public int position;
        public int lastPosition;
        public int peakPosition;
        public int weeksOnChart;
        public float influenceScore; // How much this song influences market trends
    }

    [Serializable]
    public class Chart
    {
        public string id;
        public string name;
        public string description;
        public int minLevelToAccess;
        public List<ChartEntry> entries;
        public MusicGenre primaryGenre; // Primary genre for this chart
    }

    [CreateAssetMenu(fileName = "NewChartsData", menuName = "ScriptableObjects/Charts Data")]
    public class ChartsData : ScriptableObject
    {
        public List<Chart> initialCharts;
        // Potentially add other chart-related static data here
    }
}