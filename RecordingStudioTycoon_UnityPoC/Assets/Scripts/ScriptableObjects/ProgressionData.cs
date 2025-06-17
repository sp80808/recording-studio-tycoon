using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.ScriptableObjects
{
    public class ProgressionData : ScriptableObject
    {
        public List<UnlockedFeatureInfo> unlockedFeatures;
        public List<PlayerAbilityChange> playerAbilityChanges;
        public List<UnlockedFeatureInfo> levelUpFeatures;
        public List<PlayerAbilityChange> levelUpAbilityChanges;
    }

    [System.Serializable]
    public class PlayerMilestone
    {
        public int Level;
        public List<UnlockedFeatureInfo> UnlockedFeatures; // This type needs to be defined or moved
        public List<PlayerAbilityChange> AbilityChanges; // This type needs to be defined or moved
        public int PerkPointsGained;
        public int AttributePointsGained;
    }
} 