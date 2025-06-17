using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class SubGenre
    {
        public string Id;
        public string Name;
        public string ParentGenre; // Corresponds to MusicGenre in TS
        public string Description;

        public SubGenre()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New SubGenre";
            ParentGenre = "pop";
            Description = "";
        }

        public SubGenre(string id, string name, string parentGenre, string description)
        {
            Id = id;
            Name = name;
            ParentGenre = parentGenre;
            Description = description;
        }
    }
}