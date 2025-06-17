using System;

namespace RecordingStudioTycoon.DataModels.Bands
{
    [Serializable]
    public class Artist
    {
        public string Id;
        public string Name;
        public int Popularity; // 0-100
        public string Genre; // Main genre of the artist
        public string ImagePath; // Path to artist image
    }
}