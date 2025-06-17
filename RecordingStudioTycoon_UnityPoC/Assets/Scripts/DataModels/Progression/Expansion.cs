using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class Expansion
    {
        public string Id;
        public string Name;
        public string Description;
        public int Cost;
        public bool IsUnlocked;
        public bool IsPurchased;
        public SerializableDictionary<string, float> Benefits;

        public Expansion()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Expansion";
            Description = "A new studio expansion.";
            Cost = 5000;
            IsUnlocked = false;
            IsPurchased = false;
            Benefits = new SerializableDictionary<string, float>();
        }
    }
}
