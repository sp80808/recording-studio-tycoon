using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class AggregatedPerkModifiers
    {
        public float globalRecordingQualityModifier;
        public float globalMixingQualityModifier;
        public float globalMasteringQualityModifier;
        public float contractPayoutModifier;
        public float researchSpeedModifier;
        public float staffHappinessModifier;
        public float staffTrainingSpeedModifier;
        public float marketingEffectivenessModifier;
        public float candidateQualityBonus;
        public SerializableDictionary<string, float> projectAppealModifier; // Key: genreId or "all"

        public AggregatedPerkModifiers()
        {
            globalRecordingQualityModifier = 1.0f;
            globalMixingQualityModifier = 1.0f;
            globalMasteringQualityModifier = 1.0f;
            contractPayoutModifier = 1.0f;
            researchSpeedModifier = 1.0f;
            staffHappinessModifier = 0f;
            staffTrainingSpeedModifier = 1.0f;
            marketingEffectivenessModifier = 1.0f;
            candidateQualityBonus = 0f;
            projectAppealModifier = new SerializableDictionary<string, float>();
            projectAppealModifier["all"] = 1.0f; // Default for all genres
        }
    }
}