using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class PerkUnlockCondition
    {
        public string ConditionType; // e.g., "Level", "Skill", "Achievement"
        public string TargetId; // e.g., skill name, achievement ID
        public int RequiredValue; // e.g., level number, skill level
        public List<string> PrerequisitePerks; // IDs of perks that must be unlocked first
        
        public PerkUnlockCondition()
        {
            ConditionType = "Level";
            TargetId = "";
            RequiredValue = 1;
            PrerequisitePerks = new List<string>();
        }
    }
}
