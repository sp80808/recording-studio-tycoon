using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class SubGenre
    {
        public string Id;
        public string Name;
        public string ParentGenre;
        public float Popularity;
        public SerializableDictionary<string, float> Characteristics;

        public SubGenre()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New SubGenre";
            ParentGenre = "Rock";
            Popularity = 0.5f;
            Characteristics = new SerializableDictionary<string, float>();
        }
    }
}
