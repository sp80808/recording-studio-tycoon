using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Venue
    {
        public string Id;
        public string Name;
        public string Description;
        public string Type;
        public int Capacity;
        public int BaseCost;
        public SerializableDictionary<string, float> Bonuses; // e.g., "reputationGain": 0.1
        public bool IsUnlocked;

        public Venue()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Small Club";
            Description = "";
            Type = "Club";
            Capacity = 100;
            BaseCost = 500;
            Bonuses = new SerializableDictionary<string, float>();
            IsUnlocked = false;
        }
    }
} 