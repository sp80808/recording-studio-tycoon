using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class StudioSpecialization
    {
        public string Id;
        public string Name;
        public string Description;
        public List<string> UnlockRequirements; // e.g., specific perks, level
        public List<PerkEffect> Effects; // Specialization-specific effects
        public bool IsActive;

        public StudioSpecialization()
        {
            Id = Guid.NewGuid().ToString();
            Name = "";
            Description = "";
            UnlockRequirements = new List<string>();
            Effects = new List<PerkEffect>();
            IsActive = false;
        }
    }
}