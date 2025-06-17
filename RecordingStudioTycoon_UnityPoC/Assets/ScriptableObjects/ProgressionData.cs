using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.DataModels.Progression;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "ProgressionData", menuName = "RecordingStudioTycoon/ProgressionData", order = 3)]
    public class ProgressionData : ScriptableObject
    {
        public int Level;
        public string LevelName;
        public string Description;
        public int ExperienceRequired;
        public List<string> UnlockedFeatures;
        public List<string> UnlockedEquipment;
        public List<string> UnlockedPerks;
        public List<string> UnlockedProjectTypes;
        public List<string> UnlockedMinigames;
        
        // Additional fields from merged content
        public List<UnlockedFeatureInfo> unlockedFeaturesList;
        public List<PlayerAbilityChange> playerAbilityChanges;
        public List<UnlockedFeatureInfo> levelUpFeatures;
        public List<PlayerAbilityChange> levelUpAbilityChanges;
        
        public ProgressionData()
        {
            Level = 1;
            LevelName = "Beginner Studio";
            Description = "A starting level for new recording studios.";
            ExperienceRequired = 100;
            UnlockedFeatures = new List<string>();
            UnlockedEquipment = new List<string>();
            UnlockedPerks = new List<string>();
            UnlockedProjectTypes = new List<string>();
            UnlockedMinigames = new List<string>();
        }
    }
    
    [System.Serializable]
    public class PlayerMilestone
    {
        public int Level;
        public List<UnlockedFeatureInfo> UnlockedFeatures;
        public List<PlayerAbilityChange> AbilityChanges;
        public int PerkPointsGained;
        public int AttributePointsGained;
    }
}
