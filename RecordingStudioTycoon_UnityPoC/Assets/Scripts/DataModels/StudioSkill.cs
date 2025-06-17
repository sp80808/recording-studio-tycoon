using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class StudioSkill
    {
        public StudioSkillType Name;
        public int Level;
        public int Experience;
        public float Multiplier;
        public int XpToNextLevel;
    }
} 