using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "StudioPerkData", menuName = "RecordingStudioTycoon/StudioPerkData", order = 8)]
    public class StudioPerkData : ScriptableObject
    {
        public string PerkId;
        public string PerkName;
        public string Description;
        public int UnlockLevel;
        public bool IsUnlocked;
        public SerializableDictionary<string, float> Modifiers;
        public List<string> AffectedAreas; // e.g., "RecordingQuality", "MixingEfficiency"
        public int CostToUnlock; // In-game currency or points needed to unlock
        
        public StudioPerkData()
        {
            PerkId = "perk_quality_boost";
            PerkName = "Quality Boost";
            Description = "Increases the quality of all recordings by a small percentage.";
            UnlockLevel = 2;
            IsUnlocked = false;
            Modifiers = new SerializableDictionary<string, float>();
            AffectedAreas = new List<string>();
            CostToUnlock = 1000;
        }
    }
}
