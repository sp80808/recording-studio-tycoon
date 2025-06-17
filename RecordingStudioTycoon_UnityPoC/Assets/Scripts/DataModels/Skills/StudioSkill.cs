using System;

namespace RecordingStudioTycoon.DataModels.Skills
{
    [System.Serializable]
    public class StudioSkill
    {
        public StudioSkillType Type;
        public int Level;
        public int Experience;
        public int MaxLevel;

        public StudioSkill(StudioSkillType skillType)
        {
            Type = skillType;
            Level = 1;
            Experience = 0;
            MaxLevel = 10;
        }
    }
}
