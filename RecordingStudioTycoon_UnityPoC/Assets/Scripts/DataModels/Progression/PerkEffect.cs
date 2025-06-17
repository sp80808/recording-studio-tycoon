namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class PerkEffect
    {
        public string Key;
        public float Value;
        public string Operation; // "add", "multiply", "set"
        public string Genre; // Optional: for genre-specific effects
    }
}
