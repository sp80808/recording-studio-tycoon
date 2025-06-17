using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Project
    {
        // Define properties for Project here based on your game's requirements.
        // Example properties (adapt as needed):
        public string Id;
        public string Name;
        public string Genre;
        public string Status; // e.g., "Concept", "Recording", "Mixing", "Mastering", "Completed"
        public int Quality;
        public int Progress;
        public int MaxProgress;
        public int RewardMoney;
        public int RewardXP;
        public string AssignedStaffId; // ID of staff member assigned to this project
        public List<string> RequiredSkills; // e.g., "mixing", "mastering"
        public int Difficulty;
        public string CurrentStage; // e.g., "Recording", "Mixing"
        public int CurrentDayProgress;
        public int TotalDaysToComplete; 
        public bool IsActive; 
        public string AssignedBandId; 
        public List<string> GeneratedSongIds; 
        public string ClientName; 
        public int ClientSatisfaction; 
        public int Budget; 
        public List<string> Milestones; 
        public string ContractId;

        public Project()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Project";
            Genre = "Pop";
            Status = "Concept";
            Quality = 0;
            Progress = 0;
            MaxProgress = 100;
            RewardMoney = 500;
            RewardXP = 50;
            AssignedStaffId = null;
            RequiredSkills = new List<string>();
            Difficulty = 1;
            CurrentStage = "Concept";
            CurrentDayProgress = 0;
            TotalDaysToComplete = 30;
            IsActive = false;
            AssignedBandId = null;
            GeneratedSongIds = new List<string>();
            ClientName = "";
            ClientSatisfaction = 0;
            Budget = 0;
            Milestones = new List<string>();
            ContractId = "";
        }
    }
}