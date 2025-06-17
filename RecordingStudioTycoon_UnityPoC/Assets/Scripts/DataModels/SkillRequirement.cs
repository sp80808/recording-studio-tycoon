using System;
using RecordingStudioTycoon.Core; // Assuming StudioSkillType is defined here

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class SkillRequirement
    {
        public StudioSkillType Skill;
        public int Level;
    }
}