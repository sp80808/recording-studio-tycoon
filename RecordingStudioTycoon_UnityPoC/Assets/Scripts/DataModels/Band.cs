using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Band
    {
        public string Id;
        public string Name;
        public string Genre;
        public int Reputation;
        public List<string> Members; // List of staff member IDs or names
        public List<string> ReleasedSongIds;
        public int Fanbase;
        public int AlbumSales;
        public int StreamCount;
        public int ChartPosition;

        public Band()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Band";
            Genre = "Pop";
            Reputation = 0;
            Members = new List<string>();
            ReleasedSongIds = new List<string>();
            Fanbase = 0;
            AlbumSales = 0;
            StreamCount = 0;
            ChartPosition = 0;
        }
    }
}