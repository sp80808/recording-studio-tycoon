using System;
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre
using RecordingStudioTycoon.DataModels.Bands; // Assuming Artist is here

namespace RecordingStudioTycoon.DataModels.Charts
{
    [Serializable]
    public class Song
    {
        public string Id;
        public string Title;
        public MusicGenre Genre;
        public Artist Artist; // Assuming Artist class exists
        public int QualityScore;
        public int ReleaseDay; // Game day of release
    }
}