using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Projects
{
    [System.Serializable]
    public class ProjectStage
    {
        public string Name;
        public int Order;
        public int DurationDays;
        public bool IsCompleted;
        public int Progress;
        public SerializableDictionary<string, float> QualityImpact;
        public List<string> RequiredSkills;
        public List<string> RequiredEquipment;

        public ProjectStage()
        {
            Name = "Recording";
            Order = 1;
            DurationDays = 5;
            IsCompleted = false;
            Progress = 0;
            QualityImpact = new SerializableDictionary<string, float>();
            RequiredSkills = new List<string>();
            RequiredEquipment = new List<string>();
        }
    }
}
