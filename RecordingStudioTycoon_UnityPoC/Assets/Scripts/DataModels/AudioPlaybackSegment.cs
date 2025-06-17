using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class AudioPlaybackSegment
    {
        public float StartTime;
        public float EndTime;
        public int SegmentNumber;
        public string DisplayTime;

        public AudioPlaybackSegment()
        {
            StartTime = 0f;
            EndTime = 0f;
            SegmentNumber = 0;
            DisplayTime = "0:00-0:00";
        }

        public AudioPlaybackSegment(float startTime, float endTime, int segmentNumber, string displayTime)
        {
            StartTime = startTime;
            EndTime = endTime;
            SegmentNumber = segmentNumber;
            DisplayTime = displayTime;
        }
    }
}