using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class PerkUnlockCondition
    {
        public string Type; // e.g., "playerLevel", "studioReputation", "completedProjects"
        public float Value;
        public string Genre; // Optional, for genre-specific conditions
        public string EquipmentId; // Optional, for specific equipment owned
        public string PerkId; // Optional, for specific perk unlocked

        public PerkUnlockCondition()
        {
            Type = "";
            Value = 0;
            Genre = null;
            EquipmentId = null;
            PerkId = null;
        }

        public PerkUnlockCondition(string type, float value, string genre = null, string equipmentId = null, string perkId = null)
        {
            Type = type;
            Value = value;
            Genre = genre;
            EquipmentId = equipmentId;
            PerkId = perkId;
        }
    }
}