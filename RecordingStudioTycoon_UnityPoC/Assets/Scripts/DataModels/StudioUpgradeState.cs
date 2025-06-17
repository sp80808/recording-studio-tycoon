using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class StudioUpgradeState
    {
        public List<string> UnlockedPerks; // IDs of unlocked perks
        public int AvailablePerkPoints;
        public int TotalPerkPointsEarned;
        // public SerializableDictionary<string, long> PerkCooldowns; // If perks have cooldowns
        // public List<string> ActiveEffects; // If effects are temporary or toggleable

        public StudioUpgradeState()
        {
            UnlockedPerks = new List<string>();
            AvailablePerkPoints = 0;
            TotalPerkPointsEarned = 0;
        }
    }
}