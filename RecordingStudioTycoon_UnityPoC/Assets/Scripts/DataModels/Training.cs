using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Training
    {
        public string Id;
        public string Name;
        public string Description;
        public StudioSkillType TargetSkill;
        public int CostMoney;
        public int CostTimeDays;
        public int XpGain;
        public bool IsCompleted;

        public Training()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Basic Training";
            Description = "";
            TargetSkill = StudioSkillType.recording;
            CostMoney = 100;
            CostTimeDays = 5;
            XpGain = 50;
            IsCompleted = false;
        }
    }
}