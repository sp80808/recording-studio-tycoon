using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Projects
{
    [System.Serializable]
    public class Project
    {
        public string Id;
        public string Name;
        public string Type;
        public string BandId;
        public List<string> AssignedStaffIds;
        public int CurrentStage;
        public int TotalStages;
        public int StartDay;
        public int ExpectedCompletionDay;
        public int ActualCompletionDay;
        public float Quality;
        public float Budget;
        public float Spent;
        public bool IsCompleted;
        public bool IsOnHold;
        public SerializableDictionary<string, float> Attributes;

        public Project()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Project";
            Type = "Recording";
            BandId = "";
            AssignedStaffIds = new List<string>();
            CurrentStage = 0;
            TotalStages = 5;
            StartDay = 0;
            ExpectedCompletionDay = 0;
            ActualCompletionDay = 0;
            Quality = 0f;
            Budget = 1000f;
            Spent = 0f;
            IsCompleted = false;
            IsOnHold = false;
            Attributes = new SerializableDictionary<string, float>();
        }
    }
}
