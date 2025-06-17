using System;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class PlayerAttributeChange
    {
        public string AttributeId;
        public float ValueChange;
        public bool IsPercentage;
        public int UnlockLevel;

        public PlayerAttributeChange()
        {
            AttributeId = "NewAttribute";
            ValueChange = 1.0f;
            IsPercentage = false;
            UnlockLevel = 1;
        }
    }
}
