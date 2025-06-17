using System;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [Serializable]
    public class PlayerAbilityChange
    {
        public string Name;
        public object NewValue; // Can be int, float, bool, etc.
        public string Description;
    }
}