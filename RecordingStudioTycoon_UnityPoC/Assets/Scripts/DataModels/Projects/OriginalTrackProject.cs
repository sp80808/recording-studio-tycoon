using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Projects
{
    [System.Serializable]
    public class OriginalTrackProject
    {
        public string Id;
        public string Name;
        public string BandId;
        public string Genre;
        public string SubGenre;
        public int Complexity;
        public int DurationDays;
        public int Budget;
        public int Progress;
        public bool IsCompleted;
        public List<string> AssignedStaffIds;
        public List<FocusAllocation> FocusAreas;
        public SerializableDictionary<string, float> QualityMetrics;
        public string CurrentStage;
        public int FanAppeal;
        public int IndustryAppeal;
        public int MarketAppeal;
        public string SongId; // ID of the resulting song, if completed

        public OriginalTrackProject()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Original Track";
            BandId = "";
            Genre = "Rock";
            SubGenre = "Classic Rock";
            Complexity = 3;
            DurationDays = 14;
            Budget = 5000;
            Progress = 0;
            IsCompleted = false;
            AssignedStaffIds = new List<string>();
            FocusAreas = new List<FocusAllocation>();
            QualityMetrics = new SerializableDictionary<string, float>();
            CurrentStage = "Recording";
            FanAppeal = 0;
            IndustryAppeal = 0;
            MarketAppeal = 0;
            SongId = "";
        }
    }
}
