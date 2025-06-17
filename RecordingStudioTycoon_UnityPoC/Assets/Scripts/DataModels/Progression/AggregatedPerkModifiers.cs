using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class AggregatedPerkModifiers
    {
        public float globalRecordingQualityModifier = 1.0f;
        public float globalMixingQualityModifier = 1.0f;
        public float globalMasteringQualityModifier = 1.0f;
        public float contractPayoutModifier = 1.0f;
        public float researchSpeedModifier = 1.0f;
        public float staffHappinessModifier = 1.0f;
        public float staffTrainingSpeedModifier = 1.0f;
        public float marketingEffectivenessModifier = 1.0f;
        public float candidateQualityBonus = 0f;
        public SerializableDictionary<string, float> projectAppealModifier = new SerializableDictionary<string, float>();
    }
}
