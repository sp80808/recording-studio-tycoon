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

    [Serializable]
    public class Band
    {
        public string id;
        public string name;
        public MusicGenre primaryGenre;
        public List<string> memberIds;
        public float popularity;
        public float reputation;
        public List<string> songIds;
        public bool isPlayerBand;

        public Band()
        {
            id = Guid.NewGuid().ToString();
            memberIds = new List<string>();
            songIds = new List<string>();
            isPlayerBand = false;
        }
    }
}
