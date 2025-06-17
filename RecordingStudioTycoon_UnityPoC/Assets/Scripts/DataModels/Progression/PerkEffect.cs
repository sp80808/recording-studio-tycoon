using System;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class PerkEffect
    {
        public string EffectType; // e.g., "Modifier", "Unlock", "Bonus"
        public string Target; // e.g., "ProjectQuality", "NewFeature"
        public float Value; // e.g., multiplier value, bonus amount
        public bool IsPercentage; // whether the value is a percentage
        public string Duration; // e.g., "Permanent", "Temporary:30" (days)
        public string Condition; // e.g., "Always", "OnProjectComplete"
        
        public PerkEffect()
        {
            EffectType = "Modifier";
            Target = "ProjectQuality";
            Value = 0.1f;
            IsPercentage = true;
            Duration = "Permanent";
            Condition = "Always";
        }
    }
}
