using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class PerkEffect
    {
        public string Key; // e.g., "globalRecordingQualityModifier", "contractPayoutModifier"
        public float Value;
        public string Operation; // e.g., "multiply", "add", "set"
        public string Genre; // Optional, for genre-specific effects

        public PerkEffect()
        {
            Key = "";
            Value = 0;
            Operation = "add";
            Genre = null;
        }

        public PerkEffect(string key, float value, string operation = "add", string genre = null)
        {
            Key = key;
            Value = value;
            Operation = operation;
            Genre = genre;
        }
    }
}