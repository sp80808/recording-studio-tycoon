using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Tour
    {
        public string Id;
        public string Name;
        public string Description;
        public string BandId;
        public List<string> VenueIds;
        public int DurationDays;
        public int CurrentDay;
        public int FanGain;
        public int MoneyGain;
        public bool IsActive;
        public bool IsCompleted;

        public Tour()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Local Tour";
            Description = "";
            BandId = "";
            VenueIds = new List<string>();
            DurationDays = 7;
            CurrentDay = 0;
            FanGain = 100;
            MoneyGain = 500;
            IsActive = false;
            IsCompleted = false;
        }
    }
} 