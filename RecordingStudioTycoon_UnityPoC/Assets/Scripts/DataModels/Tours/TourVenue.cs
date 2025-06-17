using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Tours
{
    [System.Serializable]
    public class TourVenue
    {
        public string id;
        public string name;
        public string location;
        public int capacity;
        public int baseCost;
        public int reputationRequirement;
        public SerializableDictionary<string, float> bonuses; // e.g., "fanGainMultiplier": 1.2
        public bool isUnlocked;
        public string description;
        public int prestigeLevel; // 1-5, how prestigious the venue is
        
        public TourVenue()
        {
            id = Guid.NewGuid().ToString();
            name = "Local Club";
            location = "Hometown";
            capacity = 200;
            baseCost = 500;
            reputationRequirement = 10;
            bonuses = new SerializableDictionary<string, float>();
            isUnlocked = false;
            description = "A small local venue for up-and-coming bands.";
            prestigeLevel = 1;
        }
    }
}
