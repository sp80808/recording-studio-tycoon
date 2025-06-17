using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Artist
    {
        public string Id;
        public string Name;
        public int Popularity; // 0-100

        public Artist()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Artist";
            Popularity = 50;
        }

        public Artist(string name, int popularity)
        {
            Id = Guid.NewGuid().ToString();
            Name = name;
            Popularity = popularity;
        }
    }
}