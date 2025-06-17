using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Songs
{
    [Serializable]
    public class Song
    {
        public string id;
        public string title;
        public string artistId;
        public MusicGenre genre;
        public int releaseYear;
        public float quality;
        public SerializableDictionary<string, float> attributes;
        public List<string> credits;
        public bool isOriginal;

        public Song()
        {
            id = Guid.NewGuid().ToString();
            attributes = new SerializableDictionary<string, float>();
            credits = new List<string>();
            isOriginal = false;
        }
    }

}
