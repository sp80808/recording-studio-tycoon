using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Charts;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "ChartsData", menuName = "ScriptableObjects/Charts Data")]
    public class ChartsDataSO : ScriptableObject
    {
        public List<Chart> AvailableCharts;
        // Potentially add a list of pre-defined ChartEntry examples for initial population or testing
        // public List<ChartEntry> SampleChartEntries; 
    }
}