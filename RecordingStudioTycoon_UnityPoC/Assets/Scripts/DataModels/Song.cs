using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Song
    {
        public string Id;
        public string Title;
        public string Genre; // Corresponds to MusicGenre in TS
        public Artist Artist;
        public int QualityScore; // 0-100, derived from project completion
        public int WeeksOnChart; // How many weeks this song has been on a chart

        public Song()
        {
            Id = Guid.NewGuid().ToString();
            Title = "New Song";
            Genre = "pop";
            Artist = new Artist();
            QualityScore = 0;
            WeeksOnChart = 0;
        }

        public Song(string title, string genre, Artist artist, int qualityScore = 0)
        {
            Id = Guid.NewGuid().ToString();
            Title = title;
            Genre = genre;
            Artist = artist;
            QualityScore = qualityScore;
            WeeksOnChart = 0;
        }
    }
}