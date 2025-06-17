using System.Collections.Generic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Equipment
    {
        public string Id;
        public string Name;
        public string Category;
        public int Price;
        public string Description;
        public SerializableDictionary<string, float> Bonuses; // e.g., qualityBonus
        public SerializableDictionary<string, int> GenreBonuses; // e.g., { "Rock": 2, "Pop": 1 }
        public string Icon;
        public SkillRequirement SkillRequirement; // Skill and level required to use this equipment
        public int Condition;
        public int AvailableFrom; // Year when equipment becomes available
        public int AvailableUntil; // Year when equipment becomes obsolete (optional)
        public string EraDescription; // Era-specific description
        public bool IsVintage; // If true, becomes more expensive over time
    }
}