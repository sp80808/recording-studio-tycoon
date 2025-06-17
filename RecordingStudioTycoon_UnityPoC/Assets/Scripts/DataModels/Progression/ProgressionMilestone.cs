using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class ProgressionMilestone
    {
        public string Id;
        public string Name;
        public string Description;
        public int LevelRequirement;
        public bool IsAchieved;
        public SerializableDictionary<string, int> Requirements;
        public List<string> Rewards;

        public ProgressionMilestone()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Milestone";
            Description = "A new progression milestone.";
            LevelRequirement = 1;
            IsAchieved = false;
            Requirements = new SerializableDictionary<string, int>();
            Rewards = new List<string>();
        }
    }
}
