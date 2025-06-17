using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

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
    public List<UnlockedFeatureInfo> UnlockedFeatures;
    public List<PlayerAbilityChange> AbilityChanges;
    public int PerkPointsGained;
    public int AttributePointsGained;
}
