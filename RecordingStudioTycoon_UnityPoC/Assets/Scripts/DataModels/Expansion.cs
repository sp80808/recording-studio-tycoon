using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Expansion
    {
        public string Id;
        public string Name;
        public string Description;
        public int Cost;
        public int PrestigeIncrease;
        public List<string> UnlocksFeatures;
        public bool IsUnlocked;

        public Expansion()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Room";
            Description = "";
            Cost = 5000;
            PrestigeIncrease = 10;
            UnlocksFeatures = new List<string>();
            IsUnlocked = false;
        }
    }
}