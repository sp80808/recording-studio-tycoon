using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class LevelUpDetails
    {
        public int newLevel;
        public List<string> unlockedFeatures;
        public List<string> unlockedEquipment;
        public List<string> unlockedPerks;
        public SerializableDictionary<string, float> attributeIncreases;

        public LevelUpDetails(int level)
        {
            newLevel = level;
            unlockedFeatures = new List<string>();
            unlockedEquipment = new List<string>();
            unlockedPerks = new List<string>();
            attributeIncreases = new SerializableDictionary<string, float>();
        }
    }
}
