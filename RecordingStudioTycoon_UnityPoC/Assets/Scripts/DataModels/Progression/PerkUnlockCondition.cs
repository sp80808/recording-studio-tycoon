namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class PerkUnlockCondition
    {
        public string Type; // "playerLevel", "studioReputation", "completedProjects", etc.
        public int Value;
        public string Genre; // Optional: for genre-specific conditions
        public string EquipmentId; // Optional: for equipment-specific conditions
        public string PerkId; // Optional: for perk-dependent conditions
    }
}
