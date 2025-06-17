using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class LevelUpDetails
    {
        public int NewPlayerLevel;
        public List<UnlockedFeatureInfo> UnlockedFeatures;
        public List<PlayerAbilityChange> AbilityChanges;
        public List<PlayerAttributeChange> AttributeChanges;
        public List<ProjectSummary> ProjectSummaries;
        public List<StaffHighlight> StaffHighlights;
    }

    [System.Serializable]
    public class UnlockedFeatureInfo
    {
        public string FeatureName;
        public string Description;
        public string Icon;
    }

    [System.Serializable]
    public class PlayerAbilityChange
    {
        public string Name;
        public object OldValue;
        public object NewValue;
    }

    [System.Serializable]
    public class PlayerAttributeChange
    {
        public string Name;
        public int OldValue;
        public int NewValue;
    }

    [System.Serializable]
    public class ProjectSummary
    {
        public string ProjectName;
        public string Outcome;
        public int QualityAchieved;
        public int MoneyEarned;
        public int XPEarned;
    }

    [System.Serializable]
    public class StaffHighlight
    {
        public string StaffName;
        public string Achievement;
        public int LevelGained;
    }
}
