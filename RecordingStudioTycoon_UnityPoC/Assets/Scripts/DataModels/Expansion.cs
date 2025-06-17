using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Expansion
    {
        public string Id;
        public string Name;
        public string Description;
        public int Cost;
        public ExpansionRequirements Requirements;
        public SerializableDictionary<string, float> Benefits; // e.g., "recordingSkillMultiplier": 1.1

        public Expansion()
        {
            Id = Guid.NewGuid().ToString();
            Name = "";
            Description = "";
            Cost = 0;
            Requirements = new ExpansionRequirements();
            Benefits = new SerializableDictionary<string, float>();
        }

        public Expansion(string name, string description, int cost, ExpansionRequirements requirements, SerializableDictionary<string, float> benefits)
        {
            Id = Guid.NewGuid().ToString();
            Name = name;
            Description = description;
            Cost = cost;
            Requirements = requirements;
            Benefits = benefits;
        }
    }
}