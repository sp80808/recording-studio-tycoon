using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class IndustryPrestige
    {
        public int Level;
        public int Points;
        public string Tier;
        // public object Benefits; // Complex benefits object, might need a dedicated class
        public int NextTierRequirement;

        public IndustryPrestige()
        {
            Level = 0;
            Points = 0;
            Tier = "Novice";
            NextTierRequirement = 100;
        }
    }
}