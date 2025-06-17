using System.Collections.Generic;

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
        public string Icon;
        public int Condition;
    }
} 