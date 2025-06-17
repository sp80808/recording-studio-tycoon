using System;
using RecordingStudioTycoon.DataModels.Charts;

namespace RecordingStudioTycoon.DataModels.Charts
{
    [Serializable]
    public class ChartEntry
    {
        public Song Song;
        public int Position;
        public int LastPosition; // Use 0 or -1 for null equivalent
        public int WeeksOnChart;
        public int PeakPosition;
        public string AudioClipPath; // Optional path to a specific audio clip for this entry
    }
}