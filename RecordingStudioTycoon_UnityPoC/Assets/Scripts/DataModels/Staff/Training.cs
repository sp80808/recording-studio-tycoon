using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Staff
{
    [System.Serializable]
    public class Training
    {
        public string Id;
        public string Name;
        public string Description;
        public int Cost;
        public int DurationDays;
        public bool IsCompleted;
        public int Progress;
        public SerializableDictionary<string, int> SkillImprovements;
        public List<string> Prerequisites; // IDs of other trainings or requirements

        public Training()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Basic Training";
            Description = "A basic training course for staff.";
            Cost = 500;
            DurationDays = 7;
            IsCompleted = false;
            Progress = 0;
            SkillImprovements = new SerializableDictionary<string, int>();
            Prerequisites = new List<string>();
        }
    }
}
