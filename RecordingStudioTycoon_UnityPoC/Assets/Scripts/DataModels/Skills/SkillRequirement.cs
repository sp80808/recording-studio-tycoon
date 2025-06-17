using System;

namespace RecordingStudioTycoon.DataModels.Skills
{
    [System.Serializable]
    public class SkillRequirement
    {
        public string SkillName;
        public int RequiredLevel;

        public SkillRequirement()
        {
            SkillName = "Recording";
            RequiredLevel = 1;
        }

        public SkillRequirement(string skillName, int requiredLevel)
        {
            SkillName = skillName;
            RequiredLevel = requiredLevel;
        }
    }
}
