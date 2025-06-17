using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "ProgressionData", menuName = "Game Data/Progression Data")]
    public class ProgressionData : ScriptableObject
    {
        public List<PlayerMilestone> PlayerMilestones; // List of all milestones

        public PlayerMilestone GetPlayerMilestone(int level)
        {
            return PlayerMilestones.Find(m => m.Level == level);
        }
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