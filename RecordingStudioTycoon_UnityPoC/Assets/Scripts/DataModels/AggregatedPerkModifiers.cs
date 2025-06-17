using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class AggregatedPerkModifiers
    {
        public float StaffEfficiencyBonus;
        public float ProjectQualityBonus;
        public float XpGainBonus;
        public float MoneyGainBonus;
        public float ReputationGainBonus;
        public int UnlockedEquipmentSlots;
        public int DailyWorkCapacityBonus;

        public AggregatedPerkModifiers()
        {
            StaffEfficiencyBonus = 0f;
            ProjectQualityBonus = 0f;
            XpGainBonus = 0f;
            MoneyGainBonus = 0f;
            ReputationGainBonus = 0f;
            UnlockedEquipmentSlots = 0;
            DailyWorkCapacityBonus = 0;
        }
    }
} 