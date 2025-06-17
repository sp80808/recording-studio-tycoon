using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class ChartEntry
    {
        public string Id;
        public Song Song;
        public int Position;
        public int PeakPosition;
        public int WeeksOnChart;
        public int LastPosition;
        public string Trend; // e.g., "up", "down", "new", "stable"
        public string AudioClipName; // Name of the audio clip file
        public AudioPlaybackSegment AudioPlaybackSegment;

        public ChartEntry()
        {
            Id = Guid.NewGuid().ToString();
            Song = new Song();
            Position = 0;
            PeakPosition = 0;
            WeeksOnChart = 0;
            LastPosition = 0;
            Trend = "new";
            AudioClipName = null;
            AudioPlaybackSegment = new AudioPlaybackSegment();
        }

        public ChartEntry(Song song, int position, int peakPosition, int weeksOnChart, int lastPosition, string trend, string audioClipName, AudioPlaybackSegment audioPlaybackSegment)
        {
            Id = Guid.NewGuid().ToString();
            Song = song;
            Position = position;
            PeakPosition = peakPosition;
            WeeksOnChart = weeksOnChart;
            LastPosition = lastPosition;
            Trend = trend;
            AudioClipName = audioClipName;
            AudioPlaybackSegment = audioPlaybackSegment;
        }
    }
}