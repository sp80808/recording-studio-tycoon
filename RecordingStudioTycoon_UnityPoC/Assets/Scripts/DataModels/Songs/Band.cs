using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Songs
{
    [System.Serializable]
    public class Band
    {
        public string Id;
        public string Name;
        public string Genre;
        public int Reputation;
        public int FanBase;
        public List<string> SongIds;
        public string ManagerId;
        public int ContractStatus;
        public int Relationship;
        public string CurrentProjectId;
        public SerializableDictionary<string, float> Attributes;

        public Band()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Band";
            Genre = "Rock";
            Reputation = 10;
            FanBase = 100;
            SongIds = new List<string>();
            ManagerId = "";
            ContractStatus = 0;
            Relationship = 50;
            CurrentProjectId = "";
            Attributes = new SerializableDictionary<string, float>();
        }
    }
}
