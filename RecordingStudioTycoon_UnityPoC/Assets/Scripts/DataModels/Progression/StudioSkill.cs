namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class StudioSkill
    {
        public StudioSkillType Name;
        public int Level = 1;
        public int Experience = 0;
        public float Multiplier = 1.0f;
        public int XpToNextLevel = 100;
    }

    public enum StudioSkillType
    {
        Recording,
        Mixing,
        Mastering,
        Production,
        Marketing,
        Business,
        Technical
    }
}
