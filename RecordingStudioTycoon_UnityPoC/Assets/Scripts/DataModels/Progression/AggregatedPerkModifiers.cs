using System;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class AggregatedPerkModifiers
    {
        public SerializableDictionary<string, float> projectAppealModifier;

        public AggregatedPerkModifiers()
        {
            projectAppealModifier = new SerializableDictionary<string, float>();
        }
    }
}
