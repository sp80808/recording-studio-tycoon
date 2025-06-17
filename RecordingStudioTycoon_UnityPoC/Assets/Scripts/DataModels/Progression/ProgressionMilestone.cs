namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class ProgressionMilestone
    {
        public string Id;
        public string Name;
        public string Description;
        public int RequiredLevel;
        public string Type; // "level", "reputation", "projects", etc.
        public int TargetValue;
        public bool IsUnlocked;
        public bool IsCompleted;
    }
}
